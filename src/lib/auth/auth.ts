import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { db } from "@/lib/db/drizzle_client";
import * as schema from "@/lib/db/schema";

const baseURL =
  process.env.BETTER_AUTH_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export const auth = betterAuth({
  baseURL,
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: schema.users,
      session: schema.sessions,
      account: schema.accounts,
      verification: schema.verifications,
    },
  }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: true,
        defaultValue: "STUDENT",
        input: true,
      },
    },
  },
  plugins: [nextCookies()],
  trustedOrigins: (() => {
    const primary = baseURL;
    const fromEnv =
      process.env.BETTER_AUTH_TRUSTED_ORIGINS?.split(",")
        .map((o) => o.trim())
        .filter(Boolean) ?? [];
    const devLocal =
      process.env.NODE_ENV !== "production"
        ? [
            "http://localhost:3000",
            "http://localhost:3001",
            "http://127.0.0.1:3000",
            "http://127.0.0.1:3001",
          ]
        : [];
    return [...new Set([primary, ...fromEnv, ...devLocal])];
  })(),
});

export type Session = typeof auth.$Infer.Session;
