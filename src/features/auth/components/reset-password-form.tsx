"use client";

import { getMessages } from "@/lib/messages";
import { useMemo, useState, useTransition } from "react";
import { useSearchParams } from "next/navigation";
import { IconLoader2, IconLock } from "@tabler/icons-react";
import { z } from "zod";

import Logo from "@/assets/marketing/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link } from "@/i18n/navigation";
import {
  PASSWORD_MIN_LENGTH,
  PASSWORD_POLICY_HINT,
  securePasswordSchema,
} from "@/lib/password-policy";

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

export function ResetPasswordForm() {
  const t = getMessages("auth.resetPassword");
  const fieldT = getMessages("auth.validation");
  const params = useSearchParams();
  const resetPasswordSchema = useMemo(
    () =>
      z
        .object({
          password: securePasswordSchema,
          confirmPassword: z.string().min(1, fieldT("confirmPassword")),
        })
        .superRefine((value, context) => {
          if (value.password !== value.confirmPassword) {
            context.addIssue({
              code: "custom",
              path: ["confirmPassword"],
              message: fieldT("passwordsMismatch"),
            });
          }
        }),
    [fieldT]
  );

  const token = useMemo(() => params.get("token")?.trim() ?? "", [params]);
  const resetError = useMemo(() => params.get("error")?.trim() ?? "", [params]);

  const [isPending, startTransition] = useTransition();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(
    resetError === "INVALID_TOKEN" ? t("invalidToken") : null
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
      setError(t("missingToken"));
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
        setError(mapApiError(payload, t("error")));
        return;
      }

      setNotice(t("success"));
      setIsSuccess(true);
      setPassword("");
      setConfirmPassword("");
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
                {t("successHint")}{" "}
                <Link
                  href="/auth/sign-in?next=/dashboard"
                  className="font-semibold text-foreground underline underline-offset-4"
                >
                  {t("signInCta")}
                </Link>
              </p>
            ) : null}

            <div className="grid gap-2">
              <Label htmlFor="password">{t("newPassword")}</Label>
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
                placeholder={t("newPasswordPlaceholder")}
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
              <Label htmlFor="confirm-password">{t("confirmNewPassword")}</Label>
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
                placeholder={t("confirmNewPasswordPlaceholder")}
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
                  <IconLoader2 className="size-4 animate-spin" stroke={1.5} />
              ) : (
                <>
                  <IconLock className="size-4" stroke={1.5} />
                  {t("submit")}
                </>
              )}
            </Button>
          </form>

          <p className="mt-5 text-center text-sm text-muted-foreground">
            {t("requestNewLink")}{" "}
            <Link
              href="/auth/forgot-password"
              className="font-semibold text-foreground underline underline-offset-4"
            >
              {t("requestAgain")}
            </Link>
          </p>
        </section>
      </div>
    </div>
  );
}
