import type { Metadata } from "next";
import { Suspense } from "react";

import { AuthForm } from "@/features/auth/components/auth-form";
import { getMessages } from "@/lib/messages";

export function generateMetadata(): Metadata {
  const t = getMessages("auth.meta.signUp");
  return {
    title: t("title"),
    description: t("description"),
  };
}

export default function SignUpPage() {
  return (
    <Suspense fallback={null}>
      <AuthForm mode="sign-up" />
    </Suspense>
  );
}
