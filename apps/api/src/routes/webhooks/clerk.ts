import type { FastifyInstance } from "fastify";
import { Webhook } from "svix";
import { prisma } from "@flowiq/db";

// Clerk org role → FlowIQ UserRole mapping
const CLERK_ROLE_MAP: Record<string, "OWNER" | "ADMIN" | "MEMBER"> = {
  "org:admin": "ADMIN",
  "org:member": "MEMBER",
};

function clerkRoleToUserRole(
  clerkRole: string | null | undefined
): "OWNER" | "ADMIN" | "MEMBER" {
  if (!clerkRole) return "MEMBER";
  return CLERK_ROLE_MAP[clerkRole] ?? "MEMBER";
}

export async function clerkWebhookRoutes(app: FastifyInstance): Promise<void> {
  // Use raw string body so svix can verify the signature
  app.addContentTypeParser(
    "application/json",
    { parseAs: "string" },
    (_req, body, done) => done(null, body)
  );

  app.post("/webhooks/clerk", async (request, reply) => {
    const webhookSecret = app.config.CLERK_WEBHOOK_SECRET;

    if (!webhookSecret) {
      app.log.warn("CLERK_WEBHOOK_SECRET not set — skipping signature check");
    } else {
      const wh = new Webhook(webhookSecret);
      try {
        wh.verify(request.body as string, {
          "svix-id": request.headers["svix-id"] as string,
          "svix-timestamp": request.headers["svix-timestamp"] as string,
          "svix-signature": request.headers["svix-signature"] as string,
        });
      } catch {
        return reply.code(400).send({ error: "Invalid webhook signature" });
      }
    }

    let evt: { type: string; data: Record<string, unknown> };
    try {
      evt = JSON.parse(request.body as string);
    } catch {
      return reply.code(400).send({ error: "Invalid JSON body" });
    }

    const { type, data } = evt;
    app.log.info({ webhookType: type }, "Clerk webhook received");

    try {
      switch (type) {
        // ── Organisation events ────────────────────────────────────────────
        case "organization.created": {
          const orgId = data.id as string;
          const name = (data.name as string) ?? "Unnamed Organisation";
          await prisma.company.upsert({
            where: { clerkOrgId: orgId },
            update: { name },
            create: { name, clerkOrgId: orgId },
          });
          break;
        }

        case "organization.updated": {
          const orgId = data.id as string;
          const name = (data.name as string) ?? "Unnamed Organisation";
          await prisma.company.updateMany({
            where: { clerkOrgId: orgId },
            data: { name },
          });
          break;
        }

        case "organization.deleted": {
          const orgId = data.id as string;
          await prisma.company.deleteMany({ where: { clerkOrgId: orgId } });
          break;
        }

        // ── Membership events ──────────────────────────────────────────────
        case "organizationMembership.created": {
          const orgId = (data.organization as { id: string }).id;
          const publicUserData = data.public_user_data as {
            user_id: string;
            email_addresses?: Array<{ email_address: string }>;
            identifier?: string;
          };
          const clerkUserId = publicUserData.user_id;
          const email =
            publicUserData.email_addresses?.[0]?.email_address ??
            publicUserData.identifier ??
            "";
          const role = clerkRoleToUserRole(data.role as string | null);

          const company = await prisma.company.findUnique({
            where: { clerkOrgId: orgId },
          });
          if (!company) {
            app.log.warn(
              { orgId },
              "organizationMembership.created: company not found"
            );
            break;
          }

          await prisma.user.upsert({
            where: { clerkId: clerkUserId },
            update: { role },
            create: {
              clerkId: clerkUserId,
              email,
              role,
              companyId: company.id,
            },
          });
          break;
        }

        case "organizationMembership.updated": {
          const clerkUserId = (
            data.public_user_data as { user_id: string }
          ).user_id;
          const role = clerkRoleToUserRole(data.role as string | null);
          await prisma.user.updateMany({
            where: { clerkId: clerkUserId },
            data: { role },
          });
          break;
        }

        case "organizationMembership.deleted": {
          const clerkUserId = (
            data.public_user_data as { user_id: string }
          ).user_id;
          await prisma.user.deleteMany({ where: { clerkId: clerkUserId } });
          break;
        }

        // ── User events ────────────────────────────────────────────────────
        case "user.deleted": {
          const clerkUserId = data.id as string;
          await prisma.user.deleteMany({ where: { clerkId: clerkUserId } });
          break;
        }

        default:
          // Unhandled event type — acknowledge silently
          break;
      }
    } catch (err) {
      app.log.error({ err, webhookType: type }, "Error processing Clerk webhook");
      return reply.code(500).send({ error: "Internal error processing webhook" });
    }

    return reply.code(200).send({ received: true });
  });
}
