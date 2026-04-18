import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { jwt } from "better-auth/plugins/jwt";

import { getDb } from "@/lib/db";
import { schema } from "@/lib/auth-schema";

const MIN_SECRET_LENGTH = 32;
const WEAK_SECRET_VALUES = new Set([
  "changeme",
  "change-me",
  "dev-secret",
  "development-secret",
  "placeholder",
  "secret",
  "your-secret",
]);

function requiredEnv(name: "BETTER_AUTH_URL" | "BETTER_AUTH_SECRET"): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`${name} is required`);
  }
  return value;
}

function parseCsvEnv(value: string | undefined): string[] {
  if (!value) {
    return [];
  }
  return value
    .split(",")
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);
}

function normalizeTrustedOrigin(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  if (trimmed.includes("*")) {
    return trimmed;
  }

  try {
    return new URL(trimmed).origin;
  } catch {
    console.warn(`[auth-config] Ignoring invalid trusted origin: ${trimmed}`);
    return null;
  }
}

function resolveTrustedOrigins(baseUrl: string): string[] {
  const baseOrigin = normalizeTrustedOrigin(baseUrl);
  const configuredOrigins = [
    process.env.NEXT_PUBLIC_BETTER_AUTH_URL?.trim() ?? "",
    ...parseCsvEnv(process.env.BETTER_AUTH_TRUSTED_ORIGINS),
  ];

  const deduped = new Set<string>();
  for (const origin of configuredOrigins) {
    const normalized = normalizeTrustedOrigin(origin);
    if (!normalized || normalized === baseOrigin) {
      continue;
    }
    deduped.add(normalized);
  }

  return [...deduped];
}

type RateLimitStorage = "memory" | "database" | "secondary-storage";

function resolveRateLimitStorage(): RateLimitStorage | undefined {
  const value = process.env.BETTER_AUTH_RATE_LIMIT_STORAGE?.trim();
  if (!value) {
    return undefined;
  }

  if (value === "memory" || value === "database" || value === "secondary-storage") {
    return value;
  }

  console.warn(
    `[auth-config] Invalid BETTER_AUTH_RATE_LIMIT_STORAGE: ${value}. Expected memory|database|secondary-storage.`
  );
  return undefined;
}

function isHttpsUrl(url: string): boolean {
  try {
    return new URL(url).protocol === "https:";
  } catch {
    return false;
  }
}

function assertSecretSecurity(secret: string): void {
  const issues: string[] = [];
  if (secret.length < MIN_SECRET_LENGTH) {
    issues.push(`length is below ${MIN_SECRET_LENGTH}`);
  }

  if (WEAK_SECRET_VALUES.has(secret.toLowerCase())) {
    issues.push("placeholder/default value");
  }

  if (issues.length === 0) {
    return;
  }

  const message = `BETTER_AUTH_SECRET is weak (${issues.join(", ")}). Generate with: openssl rand -base64 32`;
  if (process.env.NODE_ENV === "production") {
    throw new Error(message);
  }

  console.warn(`[auth-config] ${message}`);
}

function getRequestDetails(context: unknown): {
  path: string | null;
  ipAddress: string | null;
  userAgent: string | null;
} {
  const request = (context as { request?: { headers?: { get?: (name: string) => string | null }; url?: string } })
    ?.request;
  const headers = request?.headers;

  const getHeader = (name: string): string | null => {
    if (headers && typeof headers.get === "function") {
      return headers.get(name);
    }
    return null;
  };

  const forwardedFor = getHeader("x-forwarded-for");
  const ipFromForwarded = forwardedFor?.split(",")[0]?.trim();
  const ipAddress = ipFromForwarded || getHeader("x-real-ip") || getHeader("cf-connecting-ip");
  const userAgent = getHeader("user-agent");

  const requestUrl = request?.url;
  if (!requestUrl) {
    return {
      path: null,
      ipAddress: ipAddress || null,
      userAgent,
    };
  }

  try {
    const parsedUrl = new URL(requestUrl);
    return {
      path: parsedUrl.pathname,
      ipAddress: ipAddress || null,
      userAgent,
    };
  } catch {
    return {
      path: null,
      ipAddress: ipAddress || null,
      userAgent,
    };
  }
}

function logAuthAuditEvent(event: string, payload: Record<string, unknown>): void {
  console.info(
    "[auth-audit]",
    JSON.stringify({
      event,
      at: new Date().toISOString(),
      ...payload,
    })
  );
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
  assertSecretSecurity(secret);

  const audience = process.env.BETTER_AUTH_JWT_AUDIENCE?.trim() || baseUrl;
  const issuer = process.env.BETTER_AUTH_JWT_ISSUER?.trim() || baseUrl;
  const trustedOrigins = resolveTrustedOrigins(baseUrl);
  const rateLimitStorage = resolveRateLimitStorage();
  const useSecureCookies = process.env.NODE_ENV === "production" || isHttpsUrl(baseUrl);

  return betterAuth({
    baseURL: baseUrl,
    secret,
    trustedOrigins,
    database: drizzleAdapter(getDb(), {
      provider: "pg",
      schema,
    }),
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: false,
    },
    socialProviders: getSocialProviders(),
    rateLimit: {
      enabled: true,
      window: 10,
      max: 100,
      ...(rateLimitStorage ? { storage: rateLimitStorage } : {}),
      customRules: {
        "/sign-in/email": {
          window: 60,
          max: 5,
        },
        "/api/auth/sign-in/email": {
          window: 60,
          max: 5,
        },
        "/sign-up/email": {
          window: 60,
          max: 3,
        },
        "/api/auth/sign-up/email": {
          window: 60,
          max: 3,
        },
        "/change-password": {
          window: 60,
          max: 5,
        },
        "/api/auth/change-password": {
          window: 60,
          max: 5,
        },
        "/change-email": {
          window: 60,
          max: 5,
        },
        "/api/auth/change-email": {
          window: 60,
          max: 5,
        },
      },
    },
    session: {
      expiresIn: 60 * 60 * 24 * 7,
      updateAge: 60 * 60 * 24,
      freshAge: 60 * 60,
      cookieCache: {
        enabled: true,
        maxAge: 5 * 60,
        strategy: "jwe",
        version: "skrap-auth-v1",
      },
    },
    account: {
      encryptOAuthTokens: true,
      storeStateStrategy: "cookie",
    },
    advanced: {
      useSecureCookies,
      disableCSRFCheck: false,
      disableOriginCheck: false,
      ipAddress: {
        ipAddressHeaders: ["x-forwarded-for", "x-real-ip", "cf-connecting-ip"],
        disableIpTracking: false,
        ipv6Subnet: 64,
      },
    },
    databaseHooks: {
      session: {
        create: {
          after: async (session, context) => {
            const details = getRequestDetails(context);
            logAuthAuditEvent("session.created", {
              sessionId: session.id,
              userId: session.userId,
              path: details.path,
              ipAddress: details.ipAddress,
              userAgent: details.userAgent,
            });
          },
        },
        delete: {
          before: async (session, context) => {
            const details = getRequestDetails(context);
            logAuthAuditEvent("session.revoked", {
              sessionId: session.id,
              userId: session.userId,
              path: details.path,
              ipAddress: details.ipAddress,
              userAgent: details.userAgent,
            });
          },
        },
      },
      user: {
        update: {
          after: async (user, context) => {
            const details = getRequestDetails(context);
            logAuthAuditEvent("user.updated", {
              userId: user.id,
              email: user.email,
              path: details.path,
              ipAddress: details.ipAddress,
              userAgent: details.userAgent,
            });
          },
        },
      },
      account: {
        create: {
          after: async (account, context) => {
            const details = getRequestDetails(context);
            logAuthAuditEvent("account.linked", {
              accountId: account.id,
              userId: account.userId,
              provider: account.providerId,
              path: details.path,
              ipAddress: details.ipAddress,
              userAgent: details.userAgent,
            });
          },
        },
      },
    },
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
