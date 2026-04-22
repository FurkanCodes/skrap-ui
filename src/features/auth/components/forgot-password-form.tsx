"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { Loader2, Mail } from "lucide-react";
import { z } from "zod";

import Logo from "@/assets/marketing/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const forgotPasswordSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Please enter your email address.")
    .email("Please enter a valid email address."),
});

function mapApiError(error: unknown): string {
  if (!error || typeof error !== "object") {
    return "Unable to send reset email. Please try again.";
  }

  const value = error as { message?: unknown };
  if (typeof value.message === "string" && value.message.trim()) {
    return value.message;
  }

  return "Unable to send reset email. Please try again.";
}

export function ForgotPasswordForm() {
  const [isPending, startTransition] = useTransition();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);
  const [hasSubmittedAttempt, setHasSubmittedAttempt] = useState(false);

  const parsed = forgotPasswordSchema.safeParse({ email });
  const emailError =
    hasSubmittedAttempt || touched
      ? parsed.success
        ? null
        : parsed.error.issues[0]?.message ?? "Please enter a valid email address."
      : null;

  const runRequest = async () => {
    setHasSubmittedAttempt(true);
    setError(null);
    setNotice(null);

    const parsedEmail = forgotPasswordSchema.safeParse({ email });
    if (!parsedEmail.success) {
      return;
    }

    const normalizedEmail = parsedEmail.data.email;
    const redirectTo = `${window.location.origin}/auth/reset-password`;

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
        setError(mapApiError(payload));
        return;
      }

      const message =
        payload && typeof payload === "object" && typeof (payload as { message?: unknown }).message === "string"
          ? ((payload as { message: string }).message ?? "").trim()
          : "";

      setNotice(
        message ||
          "If that email exists, we sent a password reset link. Check your inbox (or server logs in local dev)."
      );
    } catch {
      setError("Unable to send reset email. Please try again.");
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
            Forgot password.
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Enter your account email and we will send you a reset link.
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
              <Label htmlFor="email">Email</Label>
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
                placeholder="you@example.com"
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
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <>
                  <Mail className="size-4" />
                  Send reset link
                </>
              )}
            </Button>
          </form>

          <p className="mt-5 text-center text-sm text-muted-foreground">
            Remembered your password?{" "}
            <Link
              href="/auth/sign-in?next=/dashboard"
              className="font-semibold text-foreground underline underline-offset-4"
            >
              Back to sign in
            </Link>
          </p>
        </section>
      </div>
    </div>
  );
}

