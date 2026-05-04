"use client";

import { useState, useTransition } from "react";
import { IconLoader2, IconMail } from "@tabler/icons-react";
import { useLocale, useTranslations } from "next-intl";
import { z } from "zod";

import Logo from "@/assets/marketing/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { localizePathname } from "@/i18n/paths";
import { Link } from "@/i18n/navigation";

function mapApiError(error: unknown, fallback: string): string {
  if (!error || typeof error !== "object") {
    return fallback;
  }

  const value = error as { message?: unknown };
  if (typeof value.message === "string" && value.message.trim()) {
    return value.message;
  }

  return fallback;
}

export function ForgotPasswordForm() {
  const t = useTranslations("auth.forgotPassword");
  const fieldT = useTranslations("auth.validation");
  const locale = useLocale();
  const schema = z.object({
    email: z
      .string()
      .trim()
      .min(1, fieldT("enterEmail"))
      .email(fieldT("validEmail")),
  });

  const [isPending, startTransition] = useTransition();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);
  const [hasSubmittedAttempt, setHasSubmittedAttempt] = useState(false);

  const parsed = schema.safeParse({ email });
  const emailError =
    hasSubmittedAttempt || touched
      ? parsed.success
        ? null
        : parsed.error.issues[0]?.message ?? fieldT("validEmail")
      : null;

  const runRequest = async () => {
    setHasSubmittedAttempt(true);
    setError(null);
    setNotice(null);

    const parsedEmail = schema.safeParse({ email });
    if (!parsedEmail.success) {
      return;
    }

    const normalizedEmail = parsedEmail.data.email;
    const redirectPath = localizePathname("/auth/reset-password", locale === "tr" ? "tr" : "en");
    const redirectTo = `${window.location.origin}${redirectPath}`;

    try {
      const response = await fetch("/api/auth/request-password-reset", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          email: normalizedEmail,
          redirectTo,
        }),
      });

      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        setError(mapApiError(payload, t("error")));
        return;
      }

      const message =
        payload && typeof payload === "object" && typeof (payload as { message?: unknown }).message === "string"
          ? ((payload as { message: string }).message ?? "").trim()
          : "";

      setNotice(
        message ||
          t("success")
      );
    } catch {
      setError(t("error"));
    }
  };

  return (
    <div className="relative isolate min-h-screen overflow-hidden bg-background text-foreground">
      <div className="pointer-events-none absolute -left-24 top-[-6rem] size-64 rounded-full bg-primary/10 blur-3xl" />
      <div className="pointer-events-none absolute -right-20 top-4 size-72 rounded-full bg-accent/40 blur-3xl" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-muted/50 to-transparent" />

      <div className="relative mx-auto flex min-h-screen w-full max-w-5xl items-center px-5 py-8 sm:px-7 sm:py-10">
        <section className="mx-auto flex w-full max-w-md flex-col justify-center">
          <Link
            href="/"
            className="mb-6 inline-flex w-fit items-center rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Logo />
          </Link>

          <h1 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
            {t("title")}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {t("subtitle")}
          </p>

          <form
            className="mt-6 space-y-3.5"
            onSubmit={(event) => {
              event.preventDefault();
              startTransition(async () => {
                await runRequest();
              });
            }}
          >
            {error ? (
              <div
                role="alert"
                className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-sm text-destructive"
              >
                {error}
              </div>
            ) : null}

            {notice ? (
              <div
                role="status"
                className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2.5 text-sm text-emerald-700 dark:text-emerald-300"
              >
                {notice}
              </div>
            ) : null}

            {process.env.NODE_ENV !== "production" ? (
              <p className="text-xs text-muted-foreground">
                Local dev tip: if external email delivery is unavailable, use the
                reset link in server logs with
                <span className="font-mono"> [auth-email][dev-link] </span>.
              </p>
            ) : null}

            <div className="grid gap-2">
              <Label htmlFor="email">{t("emailLabel")}</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                  setError(null);
                  setTouched(true);
                }}
                onBlur={() => setTouched(true)}
                  placeholder={t("emailPlaceholder")}
                disabled={isPending}
                aria-invalid={Boolean(emailError)}
                aria-describedby={emailError ? "email-error" : undefined}
                className="h-10 rounded-lg border-border bg-card"
                required
              />
              {emailError ? (
                <p id="email-error" className="text-xs text-destructive">
                  {emailError}
                </p>
              ) : null}
            </div>

            <Button
              type="submit"
              className="h-10 w-full rounded-lg text-sm font-semibold"
              disabled={isPending || !email.trim()}
            >
              {isPending ? (
                  <IconLoader2 className="size-4 animate-spin" stroke={1.5} />
              ) : (
                <>
                  <IconMail className="size-4" stroke={1.5} />
                  {t("submit")}
                </>
              )}
            </Button>
          </form>

          <p className="mt-5 text-center text-sm text-muted-foreground">
            {t("remembered")}{" "}
            <Link
              href="/auth/sign-in?next=/dashboard"
              className="font-semibold text-foreground underline underline-offset-4"
            >
              {t("backToSignIn")}
            </Link>
          </p>
        </section>
      </div>
    </div>
  );
}
