"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2, Lock } from "lucide-react";
import { z } from "zod";

import Logo from "@/assets/marketing/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  PASSWORD_MIN_LENGTH,
  PASSWORD_POLICY_HINT,
  securePasswordSchema,
} from "@/lib/password-policy";

const resetPasswordSchema = z
  .object({
    password: securePasswordSchema,
    confirmPassword: z.string().min(1, "Please confirm your password."),
  })
  .superRefine((value, context) => {
    if (value.password !== value.confirmPassword) {
      context.addIssue({
        code: "custom",
        path: ["confirmPassword"],
        message: "Passwords do not match.",
      });
    }
  });

function mapApiError(error: unknown): string {
  if (!error || typeof error !== "object") {
    return "Unable to reset password. Please try again.";
  }

  const value = error as { message?: unknown };
  if (typeof value.message === "string" && value.message.trim()) {
    return value.message;
  }

  return "Unable to reset password. Please try again.";
}

export function ResetPasswordForm() {
  const params = useSearchParams();

  const token = useMemo(() => params.get("token")?.trim() ?? "", [params]);
  const resetError = useMemo(() => params.get("error")?.trim() ?? "", [params]);

  const [isPending, startTransition] = useTransition();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(
    resetError === "INVALID_TOKEN" ? "This reset link is invalid or expired." : null
  );
  const [notice, setNotice] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [touched, setTouched] = useState<{ password?: boolean; confirmPassword?: boolean }>({});
  const [hasSubmittedAttempt, setHasSubmittedAttempt] = useState(false);

  const parsed = resetPasswordSchema.safeParse({
    password,
    confirmPassword,
  });

  const passwordError =
    hasSubmittedAttempt || touched.password
      ? parsed.success
        ? null
        : parsed.error.issues.find((issue) => issue.path[0] === "password")?.message ?? null
      : null;
  const confirmPasswordError =
    hasSubmittedAttempt || touched.confirmPassword
      ? parsed.success
        ? null
        : parsed.error.issues.find((issue) => issue.path[0] === "confirmPassword")?.message ?? null
      : null;

  const runReset = async () => {
    setHasSubmittedAttempt(true);
    setError(null);
    setNotice(null);

    if (!token) {
      setError("Missing reset token. Request a new reset email.");
      return;
    }

    const parsedValues = resetPasswordSchema.safeParse({
      password,
      confirmPassword,
    });
    if (!parsedValues.success) {
      return;
    }

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          token,
          newPassword: parsedValues.data.password,
        }),
      });

      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        setError(mapApiError(payload));
        return;
      }

      setNotice("Password updated successfully.");
      setIsSuccess(true);
      setPassword("");
      setConfirmPassword("");
    } catch {
      setError("Unable to reset password. Please try again.");
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
            Reset password.
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Set a new secure password for your account.
          </p>

          <form
            className="mt-6 space-y-3.5"
            onSubmit={(event) => {
              event.preventDefault();
              startTransition(async () => {
                await runReset();
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
            {isSuccess ? (
              <p className="text-sm text-muted-foreground">
                Password reset successfully.{" "}
                <Link
                  href="/auth/sign-in?next=/dashboard"
                  className="font-semibold text-foreground underline underline-offset-4"
                >
                  Click here to sign in.
                </Link>
              </p>
            ) : null}

            <div className="grid gap-2">
              <Label htmlFor="password">New password</Label>
              <Input
                id="password"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value);
                  setError(null);
                  setTouched((current) => ({ ...current, password: true }));
                  if (confirmPassword.length > 0) {
                    setTouched((current) => ({ ...current, confirmPassword: true }));
                  }
                }}
                onBlur={() => setTouched((current) => ({ ...current, password: true }))}
                placeholder="Enter your new password"
                disabled={isPending}
                minLength={PASSWORD_MIN_LENGTH}
                aria-invalid={Boolean(passwordError)}
                aria-describedby={passwordError ? "password-error" : undefined}
                className="h-10 rounded-lg border-border bg-card"
                required
              />
              {passwordError ? (
                <p id="password-error" className="text-xs text-destructive">
                  {passwordError}
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">{PASSWORD_POLICY_HINT}</p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="confirm-password">Confirm new password</Label>
              <Input
                id="confirm-password"
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(event) => {
                  setConfirmPassword(event.target.value);
                  setError(null);
                  setTouched((current) => ({ ...current, confirmPassword: true }));
                }}
                onBlur={() =>
                  setTouched((current) => ({ ...current, confirmPassword: true }))
                }
                placeholder="Confirm your new password"
                disabled={isPending}
                minLength={PASSWORD_MIN_LENGTH}
                aria-invalid={Boolean(confirmPasswordError)}
                aria-describedby={confirmPasswordError ? "confirm-password-error" : undefined}
                className="h-10 rounded-lg border-border bg-card"
                required
              />
              {confirmPasswordError ? (
                <p id="confirm-password-error" className="text-xs text-destructive">
                  {confirmPasswordError}
                </p>
              ) : null}
            </div>

            <Button
              type="submit"
              className="h-10 w-full rounded-lg text-sm font-semibold"
              disabled={isPending || isSuccess || !password || !confirmPassword || !token}
            >
              {isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <>
                  <Lock className="size-4" />
                  Reset password
                </>
              )}
            </Button>
          </form>

          <p className="mt-5 text-center text-sm text-muted-foreground">
            Need a new reset link?{" "}
            <Link
              href="/auth/forgot-password"
              className="font-semibold text-foreground underline underline-offset-4"
            >
              Request again
            </Link>
          </p>
        </section>
      </div>
    </div>
  );
}
