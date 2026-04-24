"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import {
  Loader2,
  LogIn,
} from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link, useRouter } from "@/i18n/navigation";
import Logo from "@/assets/marketing/logo";
import { authClient } from "@/lib/auth-client";
import {
  PASSWORD_MIN_LENGTH,
  securePasswordSchema,
} from "@/lib/password-policy";

type AuthMode = "sign-in" | "sign-up";
type SocialProvider = "google" | "github";
type PendingAction = "email" | SocialProvider | null;

interface AuthFormProps {
  mode: AuthMode;
}

type AuthFormValues = {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
};

type AuthFormField = keyof AuthFormValues;
type AuthFormFieldErrors = Partial<Record<AuthFormField, string>>;
type ParsedAuthError = { message: string; code: string | null };
const SESSION_EXPIRED_SEARCH_PARAM = "expired";

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" aria-hidden="true">
      <path
        d="M21.8 12.2c0-.75-.06-1.3-.2-1.9H12v3.5h5.64c-.11.87-.74 2.17-2.14 3.05l-.02.12 3.05 2.32.2.02c1.85-1.69 2.92-4.19 2.92-7.11Z"
        fill="#4285F4"
      />
      <path
        d="M12 22c2.76 0 5.08-.9 6.76-2.45l-3.22-2.46c-.86.59-2.01 1-3.54 1-2.7 0-4.99-1.75-5.8-4.18l-.12.01-3.16 2.4-.04.11C4.54 19.75 8 22 12 22Z"
        fill="#34A853"
      />
      <path
        d="M6.2 13.91A5.92 5.92 0 0 1 5.86 12c0-.67.12-1.3.32-1.91l-.01-.13-3.2-2.44-.11.05A9.87 9.87 0 0 0 2 12c0 1.58.38 3.07 1.06 4.43l3.14-2.4Z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.9c1.93 0 3.23.82 3.98 1.5l2.9-2.77C17.06 2.99 14.76 2 12 2 8 2 4.54 4.25 2.88 7.56l3.32 2.52C7 7.66 9.3 5.9 12 5.9Z"
        fill="#EA4335"
      />
    </svg>
  );
}

function GithubMark() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" aria-hidden="true" fill="currentColor">
      <path d="M12 .5a12 12 0 0 0-3.8 23.4c.6.1.8-.3.8-.6V21c-3.3.7-4-1.4-4-1.4-.5-1.4-1.3-1.7-1.3-1.7-1.1-.8.1-.8.1-.8 1.2.1 1.9 1.3 1.9 1.3 1.1 1.9 2.9 1.4 3.5 1.1.1-.8.4-1.4.8-1.8-2.7-.3-5.6-1.4-5.6-6a4.7 4.7 0 0 1 1.2-3.2 4.3 4.3 0 0 1 .1-3.2s1-.3 3.3 1.2a11 11 0 0 1 6 0c2.3-1.5 3.3-1.2 3.3-1.2a4.3 4.3 0 0 1 .1 3.2 4.7 4.7 0 0 1 1.2 3.2c0 4.7-2.9 5.7-5.7 6 .5.5.9 1.2.9 2.4v3.6c0 .3.2.7.8.6A12 12 0 0 0 12 .5Z" />
    </svg>
  );
}

function mapAuthError(error: unknown, fallback: string): string {
  if (typeof error === "string" && error.trim()) {
    return error;
  }
  if (error && typeof error === "object") {
    const maybe = error as { message?: unknown };
    if (typeof maybe.message === "string" && maybe.message.trim()) {
      return maybe.message;
    }
  }
  return fallback;
}

function parseAuthError(error: unknown, fallback: string): ParsedAuthError {
  const fallbackMessage = mapAuthError(error, fallback);
  if (!error || typeof error !== "object") {
    return { message: fallbackMessage, code: null };
  }

  const maybeError = error as { message?: unknown; code?: unknown };
  const message =
    typeof maybeError.message === "string" && maybeError.message.trim()
      ? maybeError.message
      : fallbackMessage;
  const code =
    typeof maybeError.code === "string" && maybeError.code.trim()
      ? maybeError.code
      : null;

  return { message, code };
}

function mapAuthFieldErrors(
  issues: z.ZodIssue[]
): AuthFormFieldErrors {
  const next: AuthFormFieldErrors = {};
  for (const issue of issues) {
    const field = issue.path[0];
    if (typeof field !== "string") {
      continue;
    }
    if (
      field !== "name" &&
      field !== "email" &&
      field !== "password" &&
      field !== "confirmPassword"
    ) {
      continue;
    }
    if (!next[field]) {
      next[field] = issue.message;
    }
  }
  return next;
}

function getAuthFormFieldErrors(
  values: AuthFormValues,
  isSignUp: boolean,
  signInSchema: z.ZodType<{ email: string; password: string }>,
  signUpSchema: z.ZodType<AuthFormValues>
): AuthFormFieldErrors {
  const parsed = isSignUp
    ? signUpSchema.safeParse(values)
    : signInSchema.safeParse({
        email: values.email,
        password: values.password,
      });

  if (parsed.success) {
    return {};
  }

  return mapAuthFieldErrors(parsed.error.issues);
}

export function AuthForm({ mode }: AuthFormProps) {
  const t = useTranslations("auth");
  const router = useRouter();
  const params = useSearchParams();
  const shouldReduceMotion = useReducedMotion();

  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [rememberDevice, setRememberDevice] = useState(false);
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const [error, setError] = useState<string | null>(null);
  const [signUpNotice, setSignUpNotice] = useState<string | null>(null);
  const [signInNotice, setSignInNotice] = useState<string | null>(null);
  const [touchedFields, setTouchedFields] = useState<
    Partial<Record<AuthFormField, boolean>>
  >({});
  const [hasSubmittedAttempt, setHasSubmittedAttempt] = useState(false);
  const handledExpiredQueryRef = useRef<string | null>(null);

  const redirectTo = useMemo(() => {
    const value = params.get("next")?.trim();
    if (!value) return "/dashboard";
    return value.startsWith("/") ? value : "/dashboard";
  }, [params]);
  const sanitizedSignInPath = useMemo(() => {
    const nextParams = new URLSearchParams(params.toString());
    nextParams.delete(SESSION_EXPIRED_SEARCH_PARAM);
    const query = nextParams.toString();
    return query ? `/auth/sign-in?${query}` : "/auth/sign-in";
  }, [params]);

  const isSignUp = mode === "sign-up";
  const signInSchema = useMemo(
    () =>
      z.object({
        email: z
          .string()
          .trim()
          .min(1, t("validation.enterEmail"))
          .email(t("validation.validEmail")),
        password: z.string().min(1, t("validation.enterPassword")),
      }),
    [t]
  );
  const signUpSchema = useMemo(
    () =>
      signInSchema
        .extend({
          name: z.string().trim().min(2, t("validation.fullName")),
          password: securePasswordSchema,
          confirmPassword: z.string().min(1, t("validation.confirmPassword")),
        })
        .superRefine((value, context) => {
          if (value.password !== value.confirmPassword) {
            context.addIssue({
              code: "custom",
              message: t("validation.passwordsMismatch"),
              path: ["confirmPassword"],
            });
          }
        }),
    [signInSchema, t]
  );
  const isBusy = isPending || pendingAction !== null;
  const isEmailActionPending = pendingAction === "email";
  const formValues = useMemo<AuthFormValues>(
    () => ({
      name,
      email,
      password,
      confirmPassword,
    }),
    [confirmPassword, email, name, password]
  );
  const validationErrors = useMemo(
    () => getAuthFormFieldErrors(formValues, isSignUp, signInSchema, signUpSchema),
    [formValues, isSignUp, signInSchema, signUpSchema]
  );
  const visibleValidationErrors = useMemo<AuthFormFieldErrors>(() => {
    if (hasSubmittedAttempt) {
      return validationErrors;
    }

    const next: AuthFormFieldErrors = {};
    const fields: AuthFormField[] = [
      "name",
      "email",
      "password",
      "confirmPassword",
    ];
    for (const field of fields) {
      if (touchedFields[field] && validationErrors[field]) {
        next[field] = validationErrors[field];
      }
    }

    return next;
  }, [hasSubmittedAttempt, touchedFields, validationErrors]);

  const nameError = isSignUp ? visibleValidationErrors.name : undefined;
  const emailError = visibleValidationErrors.email;
  const passwordError = visibleValidationErrors.password;
  const confirmPasswordError = isSignUp
    ? visibleValidationErrors.confirmPassword
    : undefined;

  const markFieldTouched = (field: AuthFormField) => {
    setTouchedFields((current) => {
      if (current[field]) {
        return current;
      }
      return {
        ...current,
        [field]: true,
      };
    });
  };

  useEffect(() => {
    if (mode !== "sign-in") {
      return;
    }
    const expired = params.get(SESSION_EXPIRED_SEARCH_PARAM);
    if (expired !== "1") {
      return;
    }

    const queryKey = params.toString();
    if (handledExpiredQueryRef.current === queryKey) {
      return;
    }
    handledExpiredQueryRef.current = queryKey;

    let cancelled = false;
    void (async () => {
      try {
        await authClient.signOut();
      } catch {
        // Continue even if sign-out fails; next sign-in can still recover.
      }

      if (cancelled) {
        return;
      }
      setSignInNotice(t("signIn.sessionExpired"));
      router.replace(sanitizedSignInPath);
    })();

    return () => {
      cancelled = true;
    };
  }, [mode, params, router, sanitizedSignInPath, t]);

  const runEmailAuth = async () => {
    setHasSubmittedAttempt(true);
    setError(null);
    if (isSignUp) {
      setSignUpNotice(null);
    } else {
      setSignInNotice(null);
    }
    const normalizedEmail = email.trim();
    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    setPendingAction("email");
    try {
      if (isSignUp) {
        const response = await authClient.signUp.email({
          name: name.trim(),
          email: normalizedEmail,
          password,
          callbackURL: redirectTo,
        });
        if (response.error) {
          const parsedError = parseAuthError(response.error, t("errors.fallback"));
          const isAlreadyExists =
            parsedError.code === "USER_ALREADY_EXISTS" ||
            parsedError.message.toLowerCase().includes("already registered");

          if (isAlreadyExists) {
            const resendResponse = await fetch("/api/auth/send-verification-email", {
              method: "POST",
              headers: {
                "content-type": "application/json",
              },
              credentials: "include",
              body: JSON.stringify({
                email: normalizedEmail,
                callbackURL: redirectTo,
              }),
            });

            if (!resendResponse.ok) {
              setError(parsedError.message);
              return;
            }

            setSignUpNotice(
              t("signUp.alreadyExistsNotice", { email: normalizedEmail })
            );
            setPassword("");
            setConfirmPassword("");
            setTouchedFields({});
            setHasSubmittedAttempt(false);
            return;
          }

          setError(parsedError.message);
          return;
        }
        setSignUpNotice(
          t("signUp.verificationSentNotice", { email: normalizedEmail })
        );
        setPassword("");
        setConfirmPassword("");
        setTouchedFields({});
        setHasSubmittedAttempt(false);
        return;
      } else {
        const response = await authClient.signIn.email({
          email: normalizedEmail,
          password,
          callbackURL: redirectTo,
          rememberMe: rememberDevice,
        });
        if (response.error) {
          setError(mapAuthError(response.error.message, t("errors.fallback")));
          return;
        }
      }
      router.push(redirectTo);
      router.refresh();
    } catch (err) {
      setError(mapAuthError(err, t("errors.fallback")));
    } finally {
      setPendingAction(null);
    }
  };

  const runSocialAuth = (provider: SocialProvider) => {
    if (isBusy) return;
    setError(null);
    if (!isSignUp) {
      setSignInNotice(null);
    }
    startTransition(async () => {
      setPendingAction(provider);
      try {
        const response = await authClient.signIn.social({
          provider,
          callbackURL: redirectTo,
        });
        if (response.error) {
          setError(mapAuthError(response.error.message, t("errors.fallback")));
        }
      } catch (err) {
        setError(mapAuthError(err, t("errors.fallback")));
      } finally {
        setPendingAction(null);
      }
    });
  };

  return (
    <div className="relative isolate min-h-screen overflow-hidden bg-background text-foreground">
      <div className="pointer-events-none absolute -left-24 top-[-6rem] size-64 rounded-full bg-primary/10 blur-3xl" />
      <div className="pointer-events-none absolute -right-20 top-4 size-72 rounded-full bg-accent/40 blur-3xl" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-muted/50 to-transparent" />

      <div className="relative mx-auto flex min-h-screen w-full max-w-5xl items-center px-5 py-8 sm:px-7 sm:py-10">
        <div className="grid w-full items-stretch gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.82fr)] lg:gap-10">
          <motion.section
            initial={{ opacity: 0, x: shouldReduceMotion ? 0 : -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={
              shouldReduceMotion
                ? { duration: 0 }
                : { duration: 0.45, ease: "easeOut" }
            }
            className="mx-auto flex w-full max-w-md flex-col justify-center"
          >
            <Link
              href="/"
              className="mb-6 inline-flex w-fit items-center rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Logo />
            </Link>

            <h1 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
              {isSignUp ? t("signUp.title") : t("signIn.title")}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {isSignUp
                ? t("signUp.subtitle")
                : t("signIn.subtitle")}
            </p>

            <form
              className="mt-6 space-y-3.5"
              onSubmit={(event) => {
                event.preventDefault();
                startTransition(async () => {
                  await runEmailAuth();
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
              {!isSignUp && signInNotice ? (
                <div
                  role="status"
                  className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2.5 text-sm text-amber-700 dark:text-amber-300"
                >
                  {signInNotice}
                </div>
              ) : null}
              {isSignUp && signUpNotice ? (
                <div
                  role="status"
                  className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2.5 text-sm text-emerald-700 dark:text-emerald-300"
                >
                  {signUpNotice}
                </div>
              ) : null}
              {isSignUp && process.env.NODE_ENV !== "production" ? (
                <p className="text-xs text-muted-foreground">
                  Local dev tip: if external email delivery is unavailable, use the
                  verification link printed in the server logs with
                  <span className="font-mono"> [auth-email][dev-link] </span>.
                </p>
              ) : null}

              {isSignUp ? (
                <div className="grid gap-2">
                  <Label htmlFor="name">{t("fields.name")}</Label>
                  <Input
                    id="name"
                    autoComplete="name"
                    value={name}
                    onChange={(event) => {
                      setName(event.target.value);
                      setError(null);
                      markFieldTouched("name");
                    }}
                    onBlur={() => markFieldTouched("name")}
                    placeholder={t("fields.namePlaceholder")}
                    disabled={isBusy}
                    aria-invalid={Boolean(nameError)}
                    aria-describedby={nameError ? "name-error" : undefined}
                    className="h-10 rounded-lg border-border bg-card"
                    required
                  />
                  {nameError ? (
                    <p id="name-error" className="text-xs text-destructive">
                      {nameError}
                    </p>
                  ) : null}
                </div>
              ) : null}

              <div className="grid gap-2">
                <Label htmlFor="email">
                  {t("fields.email")}
                </Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => {
                    setEmail(event.target.value);
                    setError(null);
                    markFieldTouched("email");
                  }}
                  onBlur={() => markFieldTouched("email")}
                  placeholder={t("fields.emailPlaceholder")}
                  disabled={isBusy}
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

              <div className="grid gap-2">
                <Label htmlFor="password">
                  {t("fields.password")}
                </Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete={isSignUp ? "new-password" : "current-password"}
                  value={password}
                  onChange={(event) => {
                    setPassword(event.target.value);
                    setError(null);
                    markFieldTouched("password");
                    if (isSignUp && confirmPassword.length > 0) {
                      markFieldTouched("confirmPassword");
                    }
                  }}
                  onBlur={() => markFieldTouched("password")}
                  placeholder={t("fields.passwordPlaceholder")}
                  disabled={isBusy}
                  minLength={isSignUp ? PASSWORD_MIN_LENGTH : 1}
                  aria-invalid={Boolean(passwordError)}
                  aria-describedby={passwordError ? "password-error" : undefined}
                  className="h-10 rounded-lg border-border bg-card"
                  required
                />
                {passwordError ? (
                  <p id="password-error" className="text-xs text-destructive">
                    {passwordError}
                  </p>
                ) : isSignUp ? (
                  <p className="text-xs text-muted-foreground">
                    {t("signUp.passwordHint")}
                  </p>
                ) : null}
              </div>

              {isSignUp ? (
                <div className="grid gap-2">
                  <Label htmlFor="confirm-password">
                    {t("fields.confirmPassword")}
                  </Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(event) => {
                      setConfirmPassword(event.target.value);
                      setError(null);
                      markFieldTouched("confirmPassword");
                    }}
                    onBlur={() => markFieldTouched("confirmPassword")}
                    placeholder={t("fields.confirmPasswordPlaceholder")}
                    disabled={isBusy}
                    minLength={PASSWORD_MIN_LENGTH}
                    aria-invalid={Boolean(confirmPasswordError)}
                    aria-describedby={
                      confirmPasswordError
                        ? "confirm-password-error"
                        : undefined
                    }
                    className="h-10 rounded-lg border-border bg-card"
                    required
                  />
                  {confirmPasswordError ? (
                    <p id="confirm-password-error" className="text-xs text-destructive">
                      {confirmPasswordError}
                    </p>
                  ) : null}
                </div>
              ) : (
                <div className="flex items-center justify-between gap-4 pt-1 text-sm text-muted-foreground">
                  <Label htmlFor="remember-device" className="inline-flex cursor-pointer items-center gap-2.5">
                    <Checkbox
                      id="remember-device"
                      checked={rememberDevice}
                      onCheckedChange={(checked) => setRememberDevice(Boolean(checked))}
                      disabled={isBusy}
                      className="data-checked:border-primary data-checked:bg-primary data-checked:text-primary-foreground"
                    />
                    {t("signIn.rememberDevice")}
                  </Label>
                  <Link
                    href="/auth/forgot-password"
                    className="font-medium text-foreground underline underline-offset-4"
                  >
                    {t("signIn.forgotPassword")}
                  </Link>
                </div>
              )}

              <Button
                type="submit"
                className="h-10 w-full rounded-lg text-sm font-semibold"
                disabled={
                  isBusy || !email.trim() || !password || (isSignUp && (!name.trim() || !confirmPassword))
                }
              >
                {isEmailActionPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <>
                    <LogIn className="size-4" />
                    {isSignUp ? t("signUp.submit") : t("signIn.submit")}
                  </>
                )}
              </Button>
            </form>

            <p className="mt-5 text-center text-sm text-muted-foreground">
              {isSignUp ? t("links.alreadyHaveAccount") : t("links.dontHaveAccount")}{" "}
              <Link
                href={
                  isSignUp
                    ? `/auth/sign-in?next=${encodeURIComponent(redirectTo)}`
                    : `/auth/sign-up?next=${encodeURIComponent(redirectTo)}`
                }
                className="font-semibold text-foreground underline underline-offset-4"
              >
                {isSignUp ? t("links.signIn") : t("links.createAccount")}
              </Link>
            </p>
          </motion.section>

          <motion.aside
            initial={{ opacity: 0, x: shouldReduceMotion ? 0 : 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={
              shouldReduceMotion
                ? { duration: 0 }
                : { duration: 0.45, delay: 0.08, ease: "easeOut" }
            }
            className="mx-auto flex w-full max-w-sm flex-col justify-center gap-6 rounded-xl bg-card/60 p-5 lg:max-w-md lg:border-l lg:border-border/70 lg:rounded-none lg:bg-transparent lg:pl-8 lg:pr-0"
          >
            <div className="space-y-2">
              <h2 className="text-xl font-semibold tracking-tight">{t("social.title")}</h2>
              <p className="text-sm text-muted-foreground">
                {t("social.subtitle")}
              </p>
            </div>

            <div className="space-y-3">
              <Button
                type="button"
                variant="outline"
                className="h-10 w-full justify-center rounded-lg border-border bg-background text-sm"
                disabled={isBusy}
                onClick={() => runSocialAuth("google")}
              >
                {pendingAction === "google" ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <>
                    <GoogleIcon />
                    {t("social.google")}
                  </>
                )}
              </Button>

              <Button
                type="button"
                variant="outline"
                className="h-10 w-full justify-center rounded-lg border-border bg-background text-sm"
                disabled={isBusy}
                onClick={() => runSocialAuth("github")}
              >
                {pendingAction === "github" ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <>
                    <GithubMark />
                    {t("social.github")}
                  </>
                )}
              </Button>
            </div>

            <p className="text-center text-xs text-muted-foreground">
              {t("legal.prefix")}{" "}
              <Link href="/terms" className="font-semibold text-foreground underline underline-offset-4">
                {t("legal.terms")}
              </Link>{" "}
              {t("legal.and")}{" "}
              <Link href="/privacy" className="font-semibold text-foreground underline underline-offset-4">
                {t("legal.privacy")}
              </Link>
              .
            </p>

          </motion.aside>
        </div>
      </div>
    </div>
  );
}
