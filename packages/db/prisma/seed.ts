import { PrismaClient, Plan, UserRole, DocumentStatus, WorkflowStatus } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Clean up existing data
  await prisma.auditLog.deleteMany();
  await prisma.workflow.deleteMany();
  await prisma.document.deleteMany();
  await prisma.user.deleteMany();
  await prisma.company.deleteMany();

  // Create two tenant companies
  const acme = await prisma.company.create({
    data: {
      id: "clp_acme_001",
      name: "Acme Corp",
      plan: Plan.PRO,
    },
  });

  const globex = await prisma.company.create({
    data: {
      id: "clp_globex_001",
      name: "Globex Inc",
      plan: Plan.FREE,
    },
  });

  // Create users for Acme
  const acmeOwner = await prisma.user.create({
    data: {
      companyId: acme.id,
      clerkId: "user_acme_owner_clerk",
      email: "owner@acme.com",
      role: UserRole.OWNER,
    },
  });

  const acmeMember = await prisma.user.create({
    data: {
      companyId: acme.id,
      clerkId: "user_acme_member_clerk",
      email: "member@acme.com",
      role: UserRole.MEMBER,
    },
  });

  // Create users for Globex
  const globexOwner = await prisma.user.create({
    data: {
      companyId: globex.id,
      clerkId: "user_globex_owner_clerk",
      email: "owner@globex.com",
      role: UserRole.OWNER,
    },
  });

  // Create documents for Acme
  const acmeDoc1 = await prisma.document.create({
    data: {
      companyId: acme.id,
      title: "Q1 Process Review",
      status: DocumentStatus.ACTIVE,
      metadata: { tags: ["process", "q1"], version: 1 },
      createdById: acmeOwner.id,
    },
  });

  const acmeDoc2 = await prisma.document.create({
    data: {
      companyId: acme.id,
      title: "Onboarding Workflow Template",
      status: DocumentStatus.DRAFT,
      metadata: { tags: ["hr", "onboarding"], version: 1 },
      createdById: acmeMember.id,
    },
  });

  // Create documents for Globex (tenant-isolated)
  const globexDoc1 = await prisma.document.create({
    data: {
      companyId: globex.id,
      title: "Sales Process Map",
      status: DocumentStatus.ACTIVE,
      metadata: { tags: ["sales"], version: 1 },
      createdById: globexOwner.id,
    },
  });

  // Create workflows for Acme
  await prisma.workflow.create({
    data: {
      companyId: acme.id,
      documentId: acmeDoc1.id,
      status: WorkflowStatus.COMPLETED,
      steps: [
        { id: 1, name: "Review", status: "completed" },
        { id: 2, name: "Approve", status: "completed" },
        { id: 3, name: "Publish", status: "completed" },
      ],
    },
  });

  await prisma.workflow.create({
    data: {
      companyId: acme.id,
      documentId: acmeDoc2.id,
      status: WorkflowStatus.PENDING,
      steps: [
        { id: 1, name: "Draft", status: "pending" },
        { id: 2, name: "Review", status: "pending" },
      ],
    },
  });

  // Create workflows for Globex (tenant-isolated)
  await prisma.workflow.create({
    data: {
      companyId: globex.id,
      documentId: globexDoc1.id,
      status: WorkflowStatus.RUNNING,
      steps: [
        { id: 1, name: "Analyze", status: "completed" },
        { id: 2, name: "Map", status: "running" },
      ],
    },
  });

  // Create audit logs
  await prisma.auditLog.createMany({
    data: [
      {
        companyId: acme.id,
        userId: acmeOwner.id,
        action: "document.created",
        resourceType: "document",
        resourceId: acmeDoc1.id,
      },
      {
        companyId: acme.id,
        userId: acmeMember.id,
        action: "document.created",
        resourceType: "document",
        resourceId: acmeDoc2.id,
      },
      {
        companyId: globex.id,
        userId: globexOwner.id,
        action: "document.created",
        resourceType: "document",
        resourceId: globexDoc1.id,
      },
    ],
  });

  console.log("✅ Seed complete:");
  console.log(`  Companies: Acme Corp (${acme.id}), Globex Inc (${globex.id})`);
  console.log(`  Users: ${acmeOwner.email}, ${acmeMember.email}, ${globexOwner.email}`);
  console.log(`  Documents: ${acmeDoc1.title}, ${acmeDoc2.title}, ${globexDoc1.title}`);
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
