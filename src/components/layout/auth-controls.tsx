"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Copy, Loader2, LogIn, LogOut, UserPlus } from "lucide-react";

import { Button, buttonVariants } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";

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
  return "Request failed. Please try again.";
}

export default function AuthControls() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const { data: session, isPending: sessionPending } = authClient.useSession();

  const copyJwt = () => {
    setStatusMessage(null);
    startTransition(async () => {
      try {
        const response = await authClient.token();
        if (response.error || !response.data?.token) {
          setStatusMessage(mapAuthError(response.error?.message));
          return;
        }
        await navigator.clipboard.writeText(response.data.token);
        setStatusMessage("JWT copied. Paste it into FastAPI Swagger Authorize.");
      } catch (error) {
        setStatusMessage(mapAuthError(error));
      }
    });
  };

  const signOut = () => {
    setStatusMessage(null);
    startTransition(async () => {
      try {
        const response = await authClient.signOut();
        if (response.error) {
          setStatusMessage(mapAuthError(response.error.message));
          return;
        }
        router.push("/auth/sign-in");
        router.refresh();
      } catch (error) {
        setStatusMessage(mapAuthError(error));
      }
    });
  };

  return (
    <div className="ml-auto flex items-center gap-2">
      {sessionPending ? (
        <div className="inline-flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="size-3.5 animate-spin" />
          Checking session
        </div>
      ) : session?.user ? (
        <>
          <span className="hidden text-xs text-muted-foreground md:inline">
            {session.user.email ?? session.user.name ?? "Signed in"}
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={copyJwt}
            disabled={isPending}
            title="Copy Bearer JWT for Swagger"
          >
            {isPending ? <Loader2 className="size-3.5 animate-spin" /> : <Copy className="size-3.5" />}
            Copy API JWT
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={signOut} disabled={isPending}>
            <LogOut className="size-3.5" />
            Sign out
          </Button>
        </>
      ) : (
        <>
          <Link href="/auth/sign-in" className={buttonVariants({ variant: "outline", size: "sm" })}>
            <LogIn className="size-3.5" />
            Sign in
          </Link>
          <Link href="/auth/sign-up" className={buttonVariants({ size: "sm" })}>
            <UserPlus className="size-3.5" />
            Sign up
          </Link>
        </>
      )}

      {statusMessage ? (
        <p className="hidden max-w-72 text-xs text-muted-foreground lg:block">{statusMessage}</p>
      ) : null}
    </div>
  );
}
