import "server-only";

import { createCipheriv, createDecipheriv, createHash, randomBytes } from "crypto";

const AUTH_CODE_TTL_MS = 2 * 60 * 1000;
const AUTHORIZE_CHALLENGE_TTL_MS = 5 * 60 * 1000;
const AUTH_CODE_VERSION = "v1";
const AUTHORIZE_CHALLENGE_VERSION = "ac1";

interface ExtensionAuthCodePayload {
  accessToken: string;
  expiresAt: number;
  redirectUri: string;
  nonce: string;
}

interface ExtensionAuthorizeChallengePayload {
  expiresAt: number;
  redirectUri: string;
  state: string;
  nonce: string;
}

function getEncryptionKey(): Buffer {
  const secret = process.env.BETTER_AUTH_SECRET?.trim();
  if (!secret) {
    throw new Error("BETTER_AUTH_SECRET is required");
  }

  return createHash("sha256").update(secret).digest();
}

function toBase64Url(value: Buffer): string {
  return value.toString("base64url");
}

function fromBase64Url(value: string): Buffer {
  return Buffer.from(value, "base64url");
}

function parseJwtExpiryMs(token: string): number | null {
  const [, payload] = token.split(".");
  if (!payload) {
    return null;
  }

  try {
    const claims = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as {
      exp?: unknown;
    };
    if (typeof claims.exp === "number" && Number.isFinite(claims.exp)) {
      return claims.exp * 1000;
    }
  } catch {
    return null;
  }

  return null;
}

export function createExtensionAuthCode(accessToken: string, redirectUri: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", getEncryptionKey(), iv);
  const payload: ExtensionAuthCodePayload = {
    accessToken,
    expiresAt: Date.now() + AUTH_CODE_TTL_MS,
    redirectUri,
    nonce: randomBytes(16).toString("hex"),
  };

  const encrypted = Buffer.concat([
    cipher.update(JSON.stringify(payload), "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();

  return [
    AUTH_CODE_VERSION,
    toBase64Url(iv),
    toBase64Url(tag),
    toBase64Url(encrypted),
  ].join(".");
}

export function createExtensionAuthorizeChallenge(redirectUri: string, state: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", getEncryptionKey(), iv);
  const payload: ExtensionAuthorizeChallengePayload = {
    expiresAt: Date.now() + AUTHORIZE_CHALLENGE_TTL_MS,
    redirectUri,
    state,
    nonce: randomBytes(16).toString("hex"),
  };

  const encrypted = Buffer.concat([
    cipher.update(JSON.stringify(payload), "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();

  return [
    AUTHORIZE_CHALLENGE_VERSION,
    toBase64Url(iv),
    toBase64Url(tag),
    toBase64Url(encrypted),
  ].join(".");
}

export function verifyExtensionAuthorizeChallenge(
  challenge: string,
  redirectUri: string,
  state: string
): void {
  const [version, rawIv, rawTag, rawEncrypted] = challenge.split(".");
  if (version !== AUTHORIZE_CHALLENGE_VERSION || !rawIv || !rawTag || !rawEncrypted) {
    throw new Error("Invalid extension authorization challenge.");
  }

  const decipher = createDecipheriv("aes-256-gcm", getEncryptionKey(), fromBase64Url(rawIv));
  decipher.setAuthTag(fromBase64Url(rawTag));
  const decrypted = Buffer.concat([
    decipher.update(fromBase64Url(rawEncrypted)),
    decipher.final(),
  ]);
  const payload = JSON.parse(decrypted.toString("utf8")) as ExtensionAuthorizeChallengePayload;

  if (payload.redirectUri !== redirectUri || payload.state !== state) {
    throw new Error("Extension authorization challenge mismatch.");
  }

  if (payload.expiresAt <= Date.now()) {
    throw new Error("Extension authorization challenge expired.");
  }
}

export function exchangeExtensionAuthCode(code: string, redirectUri: string): {
  accessToken: string;
  expiresAt: number;
} {
  const [version, rawIv, rawTag, rawEncrypted] = code.split(".");
  if (version !== AUTH_CODE_VERSION || !rawIv || !rawTag || !rawEncrypted) {
    throw new Error("Invalid extension auth code.");
  }

  const decipher = createDecipheriv("aes-256-gcm", getEncryptionKey(), fromBase64Url(rawIv));
  decipher.setAuthTag(fromBase64Url(rawTag));
  const decrypted = Buffer.concat([
    decipher.update(fromBase64Url(rawEncrypted)),
    decipher.final(),
  ]);
  const payload = JSON.parse(decrypted.toString("utf8")) as ExtensionAuthCodePayload;

  if (payload.redirectUri !== redirectUri) {
    throw new Error("Extension redirect mismatch.");
  }

  if (payload.expiresAt <= Date.now()) {
    throw new Error("Extension auth code expired.");
  }

  return {
    accessToken: payload.accessToken,
    expiresAt: parseJwtExpiryMs(payload.accessToken) ?? payload.expiresAt,
  };
}
