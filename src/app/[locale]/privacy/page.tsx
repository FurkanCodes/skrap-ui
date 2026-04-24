import type { Metadata } from "next";

import { Link } from "@/i18n/navigation";

export const metadata: Metadata = {
  title: "Privacy Policy | Dealvinci",
  description: "Privacy Policy for Dealvinci.",
};

export default function PrivacyPage() {
  return (
    <main className="mx-auto min-h-screen w-full max-w-3xl px-6 py-16 sm:px-8">
      <h1 className="text-3xl font-semibold tracking-tight">Privacy Policy</h1>
      <p className="mt-4 text-muted-foreground">
        Dealvinci collects only the data needed to operate authentication, account ownership, and
        tracker workflows. We use that data to provide product functionality, secure sessions, and
        improve reliability.
      </p>
      <p className="mt-4 text-muted-foreground">
        We do not sell personal data. We may process technical metadata (for example, IP address
        and user-agent) for security and abuse prevention. For privacy requests, contact{" "}
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
