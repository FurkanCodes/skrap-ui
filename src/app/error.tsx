"use client";

import { useEffect } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-muted/30">
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 md:px-8">
        <Card className="border-destructive/30">
          <CardHeader>
            <CardTitle>Something went wrong</CardTitle>
            <CardDescription>
              We could not render this page. Try again or refresh the browser.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={reset}>Try again</Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
