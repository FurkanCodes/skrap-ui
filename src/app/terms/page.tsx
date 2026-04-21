import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service | Dealvinci",
  description: "Terms of Service for Dealvinci.",
};

export default function TermsPage() {
  return (
    <main className="mx-auto min-h-screen w-full max-w-3xl px-6 py-16 sm:px-8">
      <h1 className="text-3xl font-semibold tracking-tight">Terms of Service</h1>
      <p className="mt-4 text-muted-foreground">
        These Terms govern your use of Dealvinci. By using the service, you agree to use it
        responsibly, comply with applicable laws, and avoid abusive or unauthorized activity.
      </p>
      <p className="mt-4 text-muted-foreground">
        Dealvinci may update features, pricing, and limits over time. Continued use after updates
        means you accept the revised terms. For account, billing, or access questions, contact us
        at{" "}
        <a className="underline underline-offset-4" href="mailto:hello@dealvinci.com">
          hello@dealvinci.com
        </a>
        .
      </p>
      <p className="mt-8">
        <Link href="/" className="underline underline-offset-4">
          Back to home
        </Link>
      </p>
    </main>
  );
}
