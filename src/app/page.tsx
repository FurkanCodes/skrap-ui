import Link from "next/link";
import { redirect } from "next/navigation";

import { buttonVariants } from "@/components/ui/button";
import { getAuthContext } from "@/lib/auth-dal";

export default async function LandingPage() {
  const auth = await getAuthContext();

  if (auth) {
    redirect("/dashboard");
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl items-center px-6 py-16">
        <section className="w-full space-y-8">
          <p className="inline-flex rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
            Skrap Workspace
          </p>

          <div className="max-w-2xl space-y-4">
            <h1 className="text-4xl font-semibold tracking-tight text-foreground md:text-5xl">
              Track products, monitor prices, and get alerts instantly.
            </h1>
            <p className="text-base text-muted-foreground md:text-lg">
              This is a mock landing page. Sign in to access your dashboard workspace and
              manage trackers.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link href="/auth/sign-in?next=/dashboard" className={buttonVariants({ size: "lg" })}>
              Sign in
            </Link>
            <Link
              href="/auth/sign-up?next=/dashboard"
              className={buttonVariants({ size: "lg", variant: "outline" })}
            >
              Create account
            </Link>
            <Link
              href="/auth/sign-in?next=/dashboard"
              className={buttonVariants({ variant: "ghost", size: "lg" })}
            >
              Go to dashboard
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
