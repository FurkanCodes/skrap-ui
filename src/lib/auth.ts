import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { jwt } from "better-auth/plugins/jwt";

import { getDb } from "@/lib/db";
import { schema } from "@/lib/auth-schema";

function requiredEnv(name: "BETTER_AUTH_URL" | "BETTER_AUTH_SECRET"): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`${name} is required`);
  }
  return value;
}

function getSocialProviders() {
  const googleClientId = process.env.GOOGLE_CLIENT_ID?.trim();
  const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();
  const githubClientId = process.env.GITHUB_CLIENT_ID?.trim();
  const githubClientSecret = process.env.GITHUB_CLIENT_SECRET?.trim();

  return {
    ...(googleClientId && googleClientSecret
      ? {
          google: {
            clientId: googleClientId,
            clientSecret: googleClientSecret,
          },
        }
      : {}),
    ...(githubClientId && githubClientSecret
      ? {
          github: {
            clientId: githubClientId,
            clientSecret: githubClientSecret,
          },
        }
      : {}),
  };
}

function buildAuth() {
  const baseUrl = requiredEnv("BETTER_AUTH_URL");
  const secret = requiredEnv("BETTER_AUTH_SECRET");
  const audience = process.env.BETTER_AUTH_JWT_AUDIENCE?.trim() || baseUrl;
  const issuer = process.env.BETTER_AUTH_JWT_ISSUER?.trim() || baseUrl;

  return betterAuth({
    baseURL: baseUrl,
    secret,
    database: drizzleAdapter(getDb(), {
      provider: "pg",
      schema,
    }),
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: false,
    },
    socialProviders: getSocialProviders(),
    plugins: [
      jwt({
        jwt: {
          issuer,
          audience,
          expirationTime: "15m",
        },
      }),
      // Must be last to forward Set-Cookie headers in server actions.
      nextCookies(),
    ],
  });
}

type AuthInstance = ReturnType<typeof buildAuth>;
let _auth: AuthInstance | undefined;

export function getAuth(): AuthInstance {
  if (!_auth) {
    _auth = buildAuth();
  }
  return _auth;
}
