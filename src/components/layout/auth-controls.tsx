"use client";

import { useState, useTransition } from "react";
import { ChevronDown, Loader2, LogIn, LogOut, UserPlus } from "lucide-react";
import { useTranslations } from "next-intl";

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
import { Link, useRouter } from "@/i18n/navigation";
import { authClient } from "@/lib/auth-client";

export default function AuthControls() {
  const t = useTranslations("layout.auth");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const { isAuthenticated, sessionPending, sessionUser } = useViewer();
  const identityLabel = sessionUser?.email ?? sessionUser?.name ?? t("signedIn");
  const avatarLabel = identityLabel.trim().slice(0, 1).toUpperCase() || "U";

  const signOut = () => {
    setStatusMessage(null);
    startTransition(async () => {
      try {
        clearViewerCache();
        const response = await authClient.signOut();
        if (response.error) {
          setStatusMessage(
            typeof response.error.message === "string" && response.error.message.trim()
              ? response.error.message
              : t("errors.requestFailed")
          );
          return;
        }
        router.replace("/");
        router.refresh();
      } catch (error) {
        setStatusMessage(
          error instanceof Error && error.message.trim()
            ? error.message
            : t("errors.requestFailed")
        );
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
              aria-label={t("openMenu")}
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
                      <p className="text-xs text-muted-foreground">{t("account")}</p>
                    </div>
                  </div>
                </DropdownMenuLabel>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuGroup className="space-y-1 px-1 py-1">
                <DropdownMenuItem
                  className="min-h-9 px-2 py-1.5"
                  onClick={signOut}
                  disabled={isPending}
                  variant="destructive"
                >
                  <LogOut className="size-4" />
                  {t("signOut")}
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
            {t("signIn")}
          </Link>
          <Link href="/auth/sign-up" className={buttonVariants({ size: "sm" })}>
            <UserPlus className="size-3.5" />
            {t("signUp")}
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
