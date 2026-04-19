"use client";

import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function TrackersDashboardUnauthenticated() {
  return (
    <Card className="border-border/80 bg-card/95 shadow-sm">
      <CardHeader>
        <CardTitle>Trackers</CardTitle>
        <CardDescription>Sign in to manage trackers and Telegram alerts.</CardDescription>
      </CardHeader>
      <CardContent>
        <Link href="/auth/sign-in?next=/dashboard" className={buttonVariants({ size: "sm" })}>
          Sign in to continue
        </Link>
      </CardContent>
    </Card>
  );
}
