export const envSchema = {
  type: "object",
  required: ["PORT", "DATABASE_URL", "CLERK_SECRET_KEY"],
  properties: {
    NODE_ENV: {
      type: "string",
      default: "development",
    },
    PORT: {
      type: "integer",
      default: 3001,
    },
    HOST: {
      type: "string",
      default: "0.0.0.0",
    },
    DATABASE_URL: {
      type: "string",
    },
    DATABASE_URL_UNPOOLED: {
      type: "string",
      default: "",
    },
    // Vercel KV (Upstash) — KV_URL is the Redis-compatible connection string.
    // Falls back to legacy REDIS_URL for local dev.
    KV_URL: {
      type: "string",
      default: "",
    },
    REDIS_URL: {
      type: "string",
      default: "redis://localhost:6379",
    },
    KV_REST_API_URL: {
      type: "string",
      default: "",
    },
    KV_REST_API_TOKEN: {
      type: "string",
      default: "",
    },
    CLERK_SECRET_KEY: {
      type: "string",
    },
    CLERK_WEBHOOK_SECRET: {
      type: "string",
      default: "",
    },
    CORS_ORIGIN: {
      type: "string",
      default: "http://localhost:3000",
    },
  },
};

declare module "fastify" {
  interface FastifyInstance {
    config: {
      NODE_ENV: string;
      PORT: number;
      HOST: string;
      DATABASE_URL: string;
      DATABASE_URL_UNPOOLED: string;
      KV_URL: string;
      REDIS_URL: string;
      KV_REST_API_URL: string;
      KV_REST_API_TOKEN: string;
      CLERK_SECRET_KEY: string;
      CLERK_WEBHOOK_SECRET: string;
      CORS_ORIGIN: string;
    };
  }
}
