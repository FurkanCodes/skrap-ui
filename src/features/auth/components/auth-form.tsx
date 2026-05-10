"use client";

import type { CSSProperties } from "react";
import { getMessages } from "@/lib/messages";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useSearchParams } from "next/navigation";
import {
  IconBellRinging,
  IconCircleCheck,
  IconGauge,
  IconLoader2,
} from "@tabler/icons-react";
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
const authLogoVars = {
  "--brand-logo-accent": "#fffa56",
  "--brand-logo-wordmark": "#fffffb",
  "--brand-logo-cutout": "#142127",
} as CSSProperties;
const visitorsInputClassName =
  "h-10 rounded-[12px] border-0 !bg-landing-soft-gray px-4 py-0 text-[16px] font-medium leading-6 !text-landing-ink shadow-none outline-2 outline-transparent placeholder:!text-landing-muted/55 focus:!outline-landing-ink focus:!ring-2 focus:!ring-landing-yellow focus-visible:!outline-landing-ink focus-visible:!ring-2 focus-visible:!ring-landing-yellow disabled:opacity-50 md:text-[16px]";
const visitorsPrimaryButtonClassName =
  "h-11 w-full rounded-full border-0 !bg-landing-ink px-5 text-[16px] font-semibold leading-6 !text-landing-card shadow-none transition-all hover:!bg-landing-muted disabled:!bg-landing-soft-gray disabled:!text-landing-muted disabled:opacity-100";
const visitorsSocialButtonClassName =
  "h-11 w-full rounded-full border-0 !bg-landing-soft-gray px-5 text-[16px] font-medium leading-6 !text-landing-muted shadow-none transition-all hover:!bg-landing-paper hover:!text-landing-ink disabled:!bg-landing-soft-gray disabled:!text-landing-muted/55";

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden="true">
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
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden="true" fill="currentColor">
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

const authTrackerRows = [
  {
    product: "Sony WH-1000XM5",
    store: "Amazon",
    price: "$298",
    target: "$289",
    status: "Watching",
  },
  {
    product: "LG C3 OLED",
    store: "Best Buy",
    price: "$1,196",
    target: "$1,099",
    status: "Checking",
  },
  {
    product: "iPad Air 11",
    store: "Apple",
    price: "$529",
    target: "$529",
    status: "Hit",
  },
] as const;

function AuthProductPreview() {
  return (
    <div className="rounded-[30px] bg-landing-soft-blue p-5 shadow-subtle-3">
      <div className="rounded-[24px] border border-border bg-landing-card p-5">
        <div className="flex items-center justify-between gap-4 border-b border-border pb-4">
          <div>
            <p className="text-caption font-bold uppercase leading-caption text-landing-muted">
              Product board
            </p>
            <h3 className="mt-1 text-heading-lg font-semibold leading-heading-lg text-landing-ink">
              28 products under watch
            </h3>
          </div>
          <span className="inline-flex items-center gap-2 rounded-full bg-landing-yellow-strong px-3 py-2 text-caption font-bold leading-none text-landing-ink">
            <IconBellRinging className="size-3.5" aria-hidden="true" stroke={1.6} />
            Telegram ready
          </span>
        </div>

        <div className="mt-4 space-y-2.5">
          {authTrackerRows.map((row) => (
            <div
              key={row.product}
              className="rounded-[18px] bg-landing-soft-gray px-4 py-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-body font-semibold leading-body text-landing-ink">
                    {row.product}
                  </p>
                  <p className="mt-1 text-caption font-bold uppercase leading-caption text-landing-muted">
                    {row.store}
                  </p>
                </div>
                <span className="rounded-full bg-landing-card px-2.5 py-1 text-[11px] font-bold uppercase leading-none text-landing-muted">
                  {row.status}
                </span>
              </div>
              <div className="mt-3 flex items-center justify-between gap-3 text-body">
                <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-landing-card">
                  <div className="h-full w-[78%] rounded-full bg-landing-ink" />
                </div>
                <span className="font-semibold text-landing-ink">{row.price}</span>
                <span className="font-medium text-landing-muted">{row.target}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 grid grid-cols-[1fr_0.78fr] gap-3">
          <div className="rounded-[20px] bg-landing-ink p-4 text-landing-card">
            <div className="flex items-center gap-2">
              <IconBellRinging className="size-4 text-landing-yellow-strong" aria-hidden="true" stroke={1.6} />
              <p className="text-caption font-bold uppercase leading-caption text-landing-card/60">
                Last alert
              </p>
            </div>
            <p className="mt-3 text-heading-sm font-semibold leading-heading-sm">
              iPad Air reached target.
            </p>
          </div>

          <div className="rounded-[20px] bg-landing-yellow p-4 text-landing-ink">
            <div className="flex items-center justify-between">
              <p className="text-caption font-bold uppercase leading-caption text-landing-muted">
                Credits
              </p>
              <IconGauge className="size-4" aria-hidden="true" stroke={1.6} />
            </div>
            <p className="mt-4 text-3xl font-semibold leading-none">7,420</p>
            <p className="mt-1 text-caption font-semibold leading-caption text-landing-muted">
              left
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function AuthVisualPanel({ mode }: { mode: AuthMode }) {
  return (
    <motion.aside
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.48, ease: "easeOut" }}
      className="relative hidden min-h-screen overflow-hidden bg-landing-yellow lg:block"
      aria-hidden="true"
    >
      <div className="mx-auto flex min-h-screen max-w-xl flex-col justify-center px-8 py-12">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-5 flex size-12 items-center justify-center rounded-full bg-landing-ink text-landing-yellow-strong">
            <IconCircleCheck className="size-6" aria-hidden="true" stroke={1.7} />
          </div>
          <h2 className="text-balance text-4xl font-semibold leading-[1.08] text-landing-ink xl:text-5xl">
            {mode === "sign-up"
              ? "Track target prices in realtime, across every store"
              : "Welcome back to your live price radar"}
          </h2>
          <p className="mx-auto mt-5 max-w-md text-heading-sm font-medium leading-heading-sm text-landing-muted">
          Turn product pages into monitored opportunities, then get the alert
          before the margin is gone.
          </p>
        </div>
        <AuthProductPreview />
      </div>
    </motion.aside>
  );
}

export function AuthForm({ mode }: AuthFormProps) {
  const t = getMessages("auth");
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
    <div className="auth-light-surface min-h-screen bg-landing-yellow font-openrunde text-landing-ink">
      <div className="grid min-h-screen lg:grid-cols-2">
        <motion.section
          initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={
            shouldReduceMotion
              ? { duration: 0 }
              : { duration: 0.42, ease: [0.22, 1, 0.36, 1] }
          }
          className="flex min-h-screen items-center justify-center bg-landing-yellow px-5 py-10 sm:px-8 lg:bg-landing-card"
        >
          <div className="w-full max-w-[360px] rounded-[32px] bg-landing-card p-6 shadow-subtle-3 sm:p-8 lg:max-w-[344px] lg:rounded-none lg:bg-transparent lg:p-0 lg:shadow-none">
            <Link
              href="/"
              className="mx-auto mb-8 flex h-12 w-fit items-center justify-center rounded-full bg-landing-ink px-4 shadow-subtle-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-landing-ink/40 focus-visible:ring-offset-2 focus-visible:ring-offset-landing-card"
              aria-label="Dealvinci home"
            >
              <Logo
                className="[&_span]:text-[1.35rem] [&_svg]:h-7 [&_svg]:w-7"
                style={authLogoVars}
              />
            </Link>

            <div className="text-center">
              <h1 className="text-[20px] font-medium leading-7 text-landing-ink">
                {isSignUp ? t("signUp.title") : t("signIn.title")}
              </h1>
              <p className="mt-0.5 text-[16px] font-normal leading-6 text-landing-muted">
                {isSignUp ? t("signUp.subtitle") : t("signIn.subtitle")}
              </p>
            </div>

            <form
              className="mt-10 space-y-3.5"
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
                  className="rounded-2xl border border-destructive/25 bg-destructive/10 px-4 py-3 text-body leading-body text-destructive"
                >
                  {error}
                </div>
              ) : null}
              {!isSignUp && signInNotice ? (
                <div
                  role="status"
                  className="rounded-2xl border border-landing-yellow-strong/50 bg-landing-yellow/45 px-4 py-3 text-body leading-body text-landing-ink"
                >
                  {signInNotice}
                </div>
              ) : null}
              {isSignUp && signUpNotice ? (
                <div
                  role="status"
                  className="rounded-2xl border border-landing-soft-green bg-landing-soft-green px-4 py-3 text-body leading-body text-landing-ink"
                >
                  {signUpNotice}
                </div>
              ) : null}
              {isSignUp && process.env.NODE_ENV !== "production" ? (
                <p className="text-caption leading-caption text-landing-muted">
                  Local dev tip: if external email delivery is unavailable, use the
                  verification link printed in the server logs with
                  <span className="font-mono"> [auth-email][dev-link] </span>.
                </p>
              ) : null}

              {isSignUp ? (
                <div className="grid gap-2">
                  <Label htmlFor="name" className="sr-only">
                    {t("fields.name")}
                  </Label>
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
                    className={visitorsInputClassName}
                    disabled={isBusy}
                    aria-invalid={Boolean(nameError)}
                    aria-describedby={nameError ? "name-error" : undefined}
                    required
                  />
                  {nameError ? (
                    <p id="name-error" className="text-caption leading-caption text-destructive">
                      {nameError}
                    </p>
                  ) : null}
                </div>
              ) : null}

              <div className="grid gap-2">
                <Label htmlFor="email" className="sr-only">
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
                  className={visitorsInputClassName}
                  disabled={isBusy}
                  aria-invalid={Boolean(emailError)}
                  aria-describedby={emailError ? "email-error" : undefined}
                  required
                />
                {emailError ? (
                  <p id="email-error" className="text-caption leading-caption text-destructive">
                    {emailError}
                  </p>
                ) : null}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="password" className="sr-only">
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
                  className={visitorsInputClassName}
                  disabled={isBusy}
                  minLength={isSignUp ? PASSWORD_MIN_LENGTH : 1}
                  aria-invalid={Boolean(passwordError)}
                  aria-describedby={passwordError ? "password-error" : undefined}
                  required
                />
                {passwordError ? (
                  <p id="password-error" className="text-caption leading-caption text-destructive">
                    {passwordError}
                  </p>
                ) : isSignUp ? (
                  <p className="text-caption leading-caption text-landing-muted">
                    {t("signUp.passwordHint")}
                  </p>
                ) : null}
              </div>

              {isSignUp ? (
                <div className="grid gap-2">
                  <Label htmlFor="confirm-password" className="sr-only">
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
                    className={visitorsInputClassName}
                    disabled={isBusy}
                    minLength={PASSWORD_MIN_LENGTH}
                    aria-invalid={Boolean(confirmPasswordError)}
                    aria-describedby={
                      confirmPasswordError
                        ? "confirm-password-error"
                        : undefined
                    }
                    required
                  />
                  {confirmPasswordError ? (
                    <p id="confirm-password-error" className="text-caption leading-caption text-destructive">
                      {confirmPasswordError}
                    </p>
                  ) : null}
                </div>
              ) : (
                <div className="flex items-center justify-between gap-4 pt-1 text-body text-landing-muted">
                  <Label htmlFor="remember-device" className="inline-flex cursor-pointer items-center gap-2.5">
                    <Checkbox
                      id="remember-device"
                      checked={rememberDevice}
                      onCheckedChange={(checked) => setRememberDevice(Boolean(checked))}
                      disabled={isBusy}
                      className="border-landing-soft-gray data-checked:border-landing-ink data-checked:bg-landing-ink data-checked:text-landing-yellow-strong"
                    />
                    {t("signIn.rememberDevice")}
                  </Label>
                  <Link
                    href="/auth/forgot-password"
                    className="font-semibold text-landing-ink transition-colors hover:text-landing-muted"
                  >
                    {t("signIn.forgotPassword")}
                  </Link>
                </div>
              )}

              <Button
                type="submit"
                className={visitorsPrimaryButtonClassName}
                disabled={
                  isBusy || !email.trim() || !password || (isSignUp && (!name.trim() || !confirmPassword))
                }
              >
                {isEmailActionPending ? (
                              <IconLoader2 className="size-4 animate-spin" stroke={1.5} />
                ) : (
                  isSignUp ? t("signUp.submit") : t("signIn.submit")
                )}
              </Button>
            </form>

            <div className="mt-8 grid grid-cols-2 gap-4">
              <Button
                type="button"
                variant="ghost"
                className={visitorsSocialButtonClassName}
                disabled={isBusy}
                onClick={() => runSocialAuth("google")}
              >
                {pendingAction === "google" ? (
                              <IconLoader2 className="size-4 animate-spin" stroke={1.5} />
                ) : (
                  <>
                    <GoogleIcon />
                    Google
                  </>
                )}
              </Button>

              <Button
                type="button"
                variant="ghost"
                className={visitorsSocialButtonClassName}
                disabled={isBusy}
                onClick={() => runSocialAuth("github")}
              >
                {pendingAction === "github" ? (
                              <IconLoader2 className="size-4 animate-spin" stroke={1.5} />
                ) : (
                  <>
                    <GithubMark />
                    GitHub
                  </>
                )}
              </Button>
            </div>

            <p className="mt-4 text-center text-[14px] font-normal leading-5 text-landing-muted">
              {isSignUp ? t("links.alreadyHaveAccount") : t("links.dontHaveAccount")}{" "}
              <Link
                href={
                  isSignUp
                    ? `/auth/sign-in?next=${encodeURIComponent(redirectTo)}`
                    : `/auth/sign-up?next=${encodeURIComponent(redirectTo)}`
                }
                className="font-semibold text-landing-ink transition-colors hover:text-landing-muted"
              >
                {isSignUp ? t("links.signIn") : t("links.createAccount")}
              </Link>
            </p>

            <p className="mt-5 text-center text-caption leading-caption text-landing-muted">
              {t("legal.prefix")}{" "}
              <Link href="/terms" className="font-semibold text-landing-ink underline underline-offset-4">
                {t("legal.terms")}
              </Link>{" "}
              {t("legal.and")}{" "}
              <Link href="/privacy" className="font-semibold text-landing-ink underline underline-offset-4">
                {t("legal.privacy")}
              </Link>
              .
            </p>
          </div>
        </motion.section>

        <AuthVisualPanel mode={mode} />
      </div>
    </div>
  );
}
