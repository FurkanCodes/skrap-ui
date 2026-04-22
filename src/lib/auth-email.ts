import "server-only";

import { Resend } from "resend";

interface AuthEmailRecipient {
  email: string;
  name?: string | null;
}

interface ResetPasswordEmailInput {
  user: AuthEmailRecipient;
  url: string;
  token: string;
}

interface VerificationEmailInput {
  user: AuthEmailRecipient;
  url: string;
  token: string;
}

interface AuthEmailOptions {
  emailAndPassword?: {
    sendResetPassword: (data: ResetPasswordEmailInput) => Promise<void>;
  };
  emailVerification?: {
    sendVerificationEmail: (data: VerificationEmailInput) => Promise<void>;
  };
}

interface ResendConfig {
  apiKey: string | null;
  from: string | null;
  replyTo: string | null;
  appName: string;
}

const RESEND_TEST_SENDER_DOMAIN = "resend.dev";
const RESEND_TEST_MODE_HINT =
  "You can only send testing emails to your own email address";

let cachedResend: Resend | null = null;
let warnedAboutMissingResendConfig = false;
let warnedAboutResendTestSender = false;
let warnedAboutDevConsoleFallback = false;

function readResendConfig(): ResendConfig {
  const apiKey = process.env.RESEND_API_KEY?.trim() || null;
  const from = process.env.AUTH_EMAIL_FROM?.trim() || null;
  const replyTo = process.env.AUTH_EMAIL_REPLY_TO?.trim() || null;
  const appName = process.env.AUTH_EMAIL_APP_NAME?.trim() || "Dealvinci";

  return {
    apiKey,
    from,
    replyTo,
    appName,
  };
}

function isResendConfigured(config: ResendConfig): boolean {
  return Boolean(config.apiKey && config.from);
}

function warnResendNotConfigured(config: ResendConfig): void {
  if (warnedAboutMissingResendConfig) {
    return;
  }

  if (!config.apiKey && !config.from) {
    return;
  }

  warnedAboutMissingResendConfig = true;
  console.warn(
    "[auth-email] Incomplete Resend configuration. Set both RESEND_API_KEY and AUTH_EMAIL_FROM to enable auth emails."
  );
}

function getResendClient(config: ResendConfig): Resend {
  if (!config.apiKey) {
    throw new Error("RESEND_API_KEY is required for auth email delivery.");
  }

  if (!cachedResend) {
    cachedResend = new Resend(config.apiKey);
  }
  return cachedResend;
}

function isDevelopmentMode(): boolean {
  return process.env.NODE_ENV !== "production";
}

function shouldUseDevConsoleFallback(): boolean {
  if (!isDevelopmentMode()) {
    return false;
  }

  const value = process.env.AUTH_EMAIL_DEV_CONSOLE_FALLBACK?.trim().toLowerCase();
  if (!value) {
    return true;
  }

  return value === "1" || value === "true" || value === "yes" || value === "on";
}

function getEmailAddress(value: string): string {
  const trimmed = value.trim();
  const matched = trimmed.match(/<([^>]+)>/);
  if (matched?.[1]) {
    return matched[1].trim().toLowerCase();
  }
  return trimmed.toLowerCase();
}

function getSenderDomain(from: string): string | null {
  const emailAddress = getEmailAddress(from);
  const separator = emailAddress.lastIndexOf("@");
  if (separator <= 0 || separator === emailAddress.length - 1) {
    return null;
  }
  return emailAddress.slice(separator + 1);
}

function warnResendTestSender(config: ResendConfig): void {
  if (warnedAboutResendTestSender || !config.from) {
    return;
  }

  const senderDomain = getSenderDomain(config.from);
  if (senderDomain !== RESEND_TEST_SENDER_DOMAIN) {
    return;
  }

  warnedAboutResendTestSender = true;
  console.warn(
    `[auth-email] AUTH_EMAIL_FROM is using ${RESEND_TEST_SENDER_DOMAIN} test sender. Emails will only deliver to your own Resend account email. Verify a custom domain at https://resend.com/domains and switch AUTH_EMAIL_FROM to that domain.`
  );
}

function warnDevConsoleFallbackEnabled(): void {
  if (warnedAboutDevConsoleFallback || !shouldUseDevConsoleFallback()) {
    return;
  }

  warnedAboutDevConsoleFallback = true;
  console.warn(
    "[auth-email] Development console fallback is enabled. Verification and reset links will be logged to the server console when delivery is unavailable."
  );
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function getDisplayName(user: AuthEmailRecipient): string {
  const value = user.name?.trim();
  return value && value.length > 0 ? value : "there";
}

function resolveResetPasswordUiUrl(baseUrl: string, rawUrl: string): string {
  try {
    const parsed = new URL(rawUrl);
    const callbackURL = parsed.searchParams.get("callbackURL");
    if (!callbackURL) {
      return rawUrl;
    }

    const token = parsed.pathname.split("/").filter(Boolean).at(-1);
    if (!token) {
      return rawUrl;
    }

    const callback = new URL(callbackURL, baseUrl);
    callback.searchParams.set("token", token);
    return callback.toString();
  } catch {
    return rawUrl;
  }
}

function authEmailLayout({
  appName,
  headline,
  intro,
  ctaLabel,
  ctaUrl,
  fallbackLabel,
}: {
  appName: string;
  headline: string;
  intro: string;
  ctaLabel: string;
  ctaUrl: string;
  fallbackLabel: string;
}): string {
  const safeHeadline = escapeHtml(headline);
  const safeIntro = escapeHtml(intro);
  const safeCtaLabel = escapeHtml(ctaLabel);
  const safeFallbackLabel = escapeHtml(fallbackLabel);
  const safeCtaUrl = escapeHtml(ctaUrl);

  return `
    <div style="background:#f5f7fb;padding:24px;font-family:Inter,ui-sans-serif,system-ui,sans-serif;color:#111827;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:16px;overflow:hidden;">
        <tr>
          <td style="padding:20px 24px;border-bottom:1px solid #eef2f7;">
            <p style="margin:0;font-size:13px;letter-spacing:.02em;color:#4b5563;">${escapeHtml(appName)}</p>
            <h1 style="margin:8px 0 0;font-size:22px;line-height:1.3;color:#111827;">${safeHeadline}</h1>
          </td>
        </tr>
        <tr>
          <td style="padding:20px 24px;">
            <p style="margin:0 0 16px;font-size:14px;line-height:1.6;color:#374151;">${safeIntro}</p>
            <p style="margin:0 0 20px;">
              <a href="${safeCtaUrl}" style="display:inline-block;background:#2563eb;color:#ffffff;text-decoration:none;padding:10px 16px;border-radius:10px;font-size:14px;font-weight:600;">${safeCtaLabel}</a>
            </p>
            <p style="margin:0;font-size:12px;line-height:1.6;color:#6b7280;">
              ${safeFallbackLabel}<br />
              <a href="${safeCtaUrl}" style="color:#2563eb;word-break:break-all;">${safeCtaUrl}</a>
            </p>
          </td>
        </tr>
      </table>
    </div>
  `;
}

function mapResendErrorMessage(message: string): string {
  const normalized = message.toLowerCase();
  if (normalized.includes("you can only send testing emails to your own email address")) {
    return "Resend is in test mode. Verify a domain at https://resend.com/domains and set AUTH_EMAIL_FROM to an address on that verified domain.";
  }

  if (normalized.includes("domain is not verified")) {
    return "Resend sender domain is not verified. Verify your domain in Resend and ensure AUTH_EMAIL_FROM uses that exact domain/subdomain.";
  }

  if (normalized.includes("invalid `from` field")) {
    return "AUTH_EMAIL_FROM is invalid. Use either email@example.com or Name <email@example.com>.";
  }

  return message;
}

function shouldFallbackForResendError(message: string): boolean {
  if (!shouldUseDevConsoleFallback()) {
    return false;
  }

  const normalized = message.toLowerCase();
  return (
    normalized.includes(RESEND_TEST_MODE_HINT.toLowerCase()) ||
    normalized.includes("domain is not verified") ||
    normalized.includes("invalid `from` field")
  );
}

function logDevConsoleLink({
  action,
  to,
  url,
  reason,
}: {
  action: "email verification" | "password reset";
  to: string;
  url: string;
  reason: string;
}): void {
  warnDevConsoleFallbackEnabled();
  console.warn(`[auth-email] Falling back to dev console link for ${action}: ${reason}`);
  console.info(`[auth-email][dev-link] ${action} for ${to}: ${url}`);
}

async function sendAuthEmail({
  config,
  to,
  subject,
  html,
  text,
  url,
  action,
}: {
  config: ResendConfig;
  to: string;
  subject: string;
  html: string;
  text: string;
  url: string;
  action: "email verification" | "password reset";
}): Promise<void> {
  const client = getResendClient(config);
  const from = config.from;
  if (!from) {
    if (shouldUseDevConsoleFallback()) {
      logDevConsoleLink({
        action,
        to,
        url,
        reason: "AUTH_EMAIL_FROM is not configured",
      });
      return;
    }
    throw new Error("AUTH_EMAIL_FROM is required for auth email delivery.");
  }

  const result = await client.emails.send({
    from,
    to: [to],
    subject,
    html,
    text,
    ...(config.replyTo ? { replyTo: config.replyTo } : {}),
  });

  if (result.error) {
    if (shouldFallbackForResendError(result.error.message)) {
      logDevConsoleLink({
        action,
        to,
        url,
        reason: result.error.message,
      });
      return;
    }

    throw new Error(
      `[auth-email] Resend failed (${result.error.name ?? "unknown_error"}): ${mapResendErrorMessage(
        result.error.message
      )}`
    );
  }
}

function createDevConsoleEmailOptions(appName: string, baseUrl: string): AuthEmailOptions {
  warnDevConsoleFallbackEnabled();

  return {
    emailAndPassword: {
      sendResetPassword: async ({ user, url }) => {
        const to = user.email.trim();
        if (!to) {
          return;
        }
        const resetUiUrl = resolveResetPasswordUiUrl(baseUrl, url);
        console.info(
          `[auth-email][dev-link] password reset for ${to} (${appName}): ${resetUiUrl}`
        );
      },
    },
    emailVerification: {
      sendVerificationEmail: async ({ user, url }) => {
        const to = user.email.trim();
        if (!to) {
          return;
        }
        console.info(
          `[auth-email][dev-link] email verification for ${to} (${appName}): ${url}`
        );
      },
    },
  };
}

export function getAuthEmailOptions(baseUrl: string): AuthEmailOptions {
  const config = readResendConfig();
  if (!isResendConfigured(config)) {
    warnResendNotConfigured(config);
    if (shouldUseDevConsoleFallback()) {
      return createDevConsoleEmailOptions(config.appName, baseUrl);
    }
    return {};
  }
  warnResendTestSender(config);

  return {
    emailAndPassword: {
      sendResetPassword: async ({ user, url }) => {
        const to = user.email.trim();
        if (!to) {
          return;
        }
        const resetUiUrl = resolveResetPasswordUiUrl(baseUrl, url);

        const subject = `${config.appName} password reset`;
        const intro = `Hi ${getDisplayName(user)}, use the button below to reset your password. This link points to ${new URL(
          baseUrl
        ).host} and expires soon.`;
        const html = authEmailLayout({
          appName: config.appName,
          headline: "Reset your password",
          intro,
          ctaLabel: "Reset password",
          ctaUrl: resetUiUrl,
          fallbackLabel: "If the button does not work, open this link:",
        });
        const text = `Reset your password: ${resetUiUrl}`;

        await sendAuthEmail({
          config,
          to,
          subject,
          html,
          text,
          url: resetUiUrl,
          action: "password reset",
        });
      },
    },
    emailVerification: {
      sendVerificationEmail: async ({ user, url }) => {
        const to = user.email.trim();
        if (!to) {
          return;
        }

        const subject = `${config.appName} email verification`;
        const intro = `Hi ${getDisplayName(user)}, verify this email address to keep your account secure.`;
        const html = authEmailLayout({
          appName: config.appName,
          headline: "Verify your email",
          intro,
          ctaLabel: "Verify email",
          ctaUrl: url,
          fallbackLabel: "If the button does not work, open this link:",
        });
        const text = `Verify your email: ${url}`;

        await sendAuthEmail({
          config,
          to,
          subject,
          html,
          text,
          url,
          action: "email verification",
        });
      },
    },
  };
}
