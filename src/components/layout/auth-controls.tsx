"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronDown, Copy, Loader2, LogIn, LogOut, UserPlus } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { clearViewerCache } from "@/features/tracking/viewer/viewer-cache";
import { useViewer } from "@/features/tracking/viewer/viewer-provider";
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
  const { isAuthenticated, sessionPending, sessionUser } = useViewer();
  const identityLabel = sessionUser?.email ?? sessionUser?.name ?? "Signed in";
  const avatarLabel = identityLabel.trim().slice(0, 1).toUpperCase() || "U";

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
        clearViewerCache();
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
    <div className="flex items-center gap-2">
      {isAuthenticated ? (
        <>
          <DropdownMenu>
            <DropdownMenuTrigger
              className="inline-flex h-9 items-center gap-2 rounded-md border border-border bg-background px-2.5 text-sm text-foreground outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring/40 disabled:pointer-events-none disabled:opacity-50"
              disabled={isPending || sessionPending}
              aria-label="Open account menu"
            >
              <Avatar size="sm">
                <AvatarFallback>{avatarLabel}</AvatarFallback>
              </Avatar>
              <span className="hidden max-w-44 truncate text-xs text-muted-foreground md:inline">
                {identityLabel}
              </span>
              {isPending ? (
                <Loader2 className="size-3.5 animate-spin text-muted-foreground" />
              ) : (
                <ChevronDown className="size-3.5 text-muted-foreground" />
              )}
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" sideOffset={8} className="w-64 p-1.5">
              <DropdownMenuGroup>
                <DropdownMenuLabel className="px-2 py-1.5">
                  <div className="flex items-center gap-2.5 py-0.5">
                    <Avatar size="sm">
                      <AvatarFallback>{avatarLabel}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="truncate text-sm text-foreground">{identityLabel}</p>
                      <p className="text-xs text-muted-foreground">Account</p>
                    </div>
                  </div>
                </DropdownMenuLabel>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuGroup className="space-y-1 px-1 py-1">
                <DropdownMenuItem
                  className="min-h-9 px-2 py-1.5"
                  onClick={copyJwt}
                  disabled={isPending || sessionPending}
                >
                  <Copy className="size-4" />
                  Developer token
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="min-h-9 px-2 py-1.5"
                  onClick={signOut}
                  disabled={isPending}
                  variant="destructive"
                >
                  <LogOut className="size-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </>
      ) : (
        <>
          <Link
            href="/auth/sign-in"
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
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
        <p className="sr-only" role="status" aria-live="polite">
          {statusMessage}
        </p>
      ) : null}
    </div>
  );
}
