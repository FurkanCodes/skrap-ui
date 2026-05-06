import type { Metadata } from "next";

import { AuthForm } from "@/features/auth/components/auth-form";
import { getMessages } from "@/lib/messages";

export function generateMetadata(): Metadata {
  const t = getMessages("auth.meta.signIn");
  return {
    title: t("title"),
    description: t("description"),
  };
}

export default function SignInPage() {
  return <AuthForm mode="sign-in" />;
}
