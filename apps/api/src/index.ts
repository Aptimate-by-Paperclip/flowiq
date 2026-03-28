import Fastify from "fastify";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import envPlugin from "@fastify/env";
import { envSchema } from "./config.js";
import { healthRoutes } from "./routes/health.js";
import { clerkWebhookRoutes } from "./routes/webhooks/clerk.js";
import authPlugin from "./plugins/auth.js";

const app = Fastify({
  logger: {
    transport:
      process.env.NODE_ENV !== "production"
        ? { target: "pino-pretty", options: { colorize: true } }
        : undefined,
  },
});

async function bootstrap(): Promise<void> {
  // Register env config
  await app.register(envPlugin, {
    schema: envSchema,
    dotenv: true,
  });

  // Register plugins
  await app.register(helmet);
  await app.register(cors, {
    origin: app.config.CORS_ORIGIN,
    credentials: true,
  });

  // Register Clerk auth plugin (decorates request.auth, request.currentUser, etc.)
  await app.register(authPlugin);

  // Register routes
  await app.register(healthRoutes);
  await app.register(clerkWebhookRoutes);

  // Start server
  const host = process.env.HOST ?? "0.0.0.0";
  const port = Number(process.env.PORT ?? 3001);

  await app.listen({ host, port });
}

bootstrap().catch((err) => {
  console.error(err);
  process.exit(1);
});
