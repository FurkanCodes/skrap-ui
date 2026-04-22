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

let cachedResend: Resend | null = null;
let warnedAboutMissingResendConfig = false;

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

async function sendAuthEmail({
  config,
  to,
  subject,
  html,
  text,
}: {
  config: ResendConfig;
  to: string;
  subject: string;
  html: string;
  text: string;
}): Promise<void> {
  const client = getResendClient(config);
  const from = config.from;
  if (!from) {
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
    throw new Error(
      `[auth-email] Resend failed (${result.error.name ?? "unknown_error"}): ${result.error.message}`
    );
  }
}

export function getAuthEmailOptions(baseUrl: string): AuthEmailOptions {
  const config = readResendConfig();
  if (!isResendConfigured(config)) {
    warnResendNotConfigured(config);
    return {};
  }

  return {
    emailAndPassword: {
      sendResetPassword: async ({ user, url }) => {
        const to = user.email.trim();
        if (!to) {
          return;
        }

        const subject = `${config.appName} password reset`;
        const intro = `Hi ${getDisplayName(user)}, use the button below to reset your password. This link points to ${new URL(
          baseUrl
        ).host} and expires soon.`;
        const html = authEmailLayout({
          appName: config.appName,
          headline: "Reset your password",
          intro,
          ctaLabel: "Reset password",
          ctaUrl: url,
          fallbackLabel: "If the button does not work, open this link:",
        });
        const text = `Reset your password: ${url}`;

        await sendAuthEmail({
          config,
          to,
          subject,
          html,
          text,
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
        });
      },
    },
  };
}
