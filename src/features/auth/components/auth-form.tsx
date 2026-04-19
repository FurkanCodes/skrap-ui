"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, LogIn } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";

type AuthMode = "sign-in" | "sign-up";
type SocialProvider = "google" | "github";

interface AuthFormProps {
  mode: AuthMode;
}

function mapAuthError(error: unknown): string {
  if (typeof error === "string" && error.trim()) {
    return error;
  }
  if (error && typeof error === "object") {
    const maybe = error as { message?: unknown };
    if (typeof maybe.message === "string" && maybe.message.trim()) {
      return maybe.message;
    }
  }
  return "Authentication failed. Please try again.";
}

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const params = useSearchParams();

  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const redirectTo = useMemo(() => {
    const value = params.get("next")?.trim();
    if (!value) return "/dashboard";
    return value.startsWith("/") ? value : "/dashboard";
  }, [params]);

  const isSignUp = mode === "sign-up";

  const runEmailAuth = () => {
    setError(null);
    startTransition(async () => {
      try {
        if (isSignUp) {
          const response = await authClient.signUp.email({
            name: name.trim(),
            email: email.trim(),
            password,
            callbackURL: redirectTo,
          });
          if (response.error) {
            setError(mapAuthError(response.error.message));
            return;
          }
        } else {
          const response = await authClient.signIn.email({
            email: email.trim(),
            password,
            callbackURL: redirectTo,
          });
          if (response.error) {
            setError(mapAuthError(response.error.message));
            return;
          }
        }
        router.push(redirectTo);
        router.refresh();
      } catch (err) {
        setError(mapAuthError(err));
      }
    });
  };

  const runSocialAuth = (provider: SocialProvider) => {
    setError(null);
    startTransition(async () => {
      try {
        const response = await authClient.signIn.social({
          provider,
          callbackURL: redirectTo,
        });
        if (response.error) {
          setError(mapAuthError(response.error.message));
        }
      } catch (err) {
        setError(mapAuthError(err));
      }
    });
  };

  return (
    <div className="mx-auto flex min-h-[calc(100vh-9rem)] w-full max-w-md items-center px-6 py-10">
      <Card className="w-full">
        <CardHeader className="space-y-2">
          <CardTitle className="text-2xl font-semibold tracking-tight">
            {isSignUp ? "Create your account" : "Welcome back"}
          </CardTitle>
          <CardDescription>
            {isSignUp
              ? "Sign up to manage tracked items, Telegram alerts, and plan limits."
              : "Sign in to access tracking and integrations."}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {error ? (
            <div
              role="alert"
              className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive"
            >
              {error}
            </div>
          ) : null}

          {isSignUp ? (
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                autoComplete="name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Jane Doe"
                disabled={isPending}
                required
              />
            </div>
          ) : null}

          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              disabled={isPending}
              required
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              autoComplete={isSignUp ? "new-password" : "current-password"}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="••••••••"
              disabled={isPending}
              minLength={8}
              required
            />
          </div>

          <Button
            type="button"
            className="w-full"
            disabled={isPending || !email.trim() || !password || (isSignUp && !name.trim())}
            onClick={runEmailAuth}
          >
            {isPending ? <Loader2 className="size-4 animate-spin" /> : <LogIn className="size-4" />}
            {isSignUp ? "Sign Up" : "Sign In"}
          </Button>

          <div className="grid gap-2">
            <Button
              type="button"
              variant="outline"
              className="w-full"
              disabled={isPending}
              onClick={() => runSocialAuth("google")}
            >
              Continue with Google
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full"
              disabled={isPending}
              onClick={() => runSocialAuth("github")}
            >
              Continue with GitHub
            </Button>
          </div>

          <p className="text-center text-sm text-muted-foreground">
            {isSignUp ? "Already have an account?" : "Need an account?"}{" "}
            <Link
              href={isSignUp ? `/auth/sign-in?next=${encodeURIComponent(redirectTo)}` : `/auth/sign-up?next=${encodeURIComponent(redirectTo)}`}
              className="font-medium text-foreground underline underline-offset-4"
            >
              {isSignUp ? "Sign in" : "Create one"}
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
