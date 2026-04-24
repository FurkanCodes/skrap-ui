import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { AuthForm } from "@/features/auth/components/auth-form";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("auth.meta.signUp");
  return {
    title: t("title"),
    description: t("description"),
  };
}

export default function SignUpPage() {
  return <AuthForm mode="sign-up" />;
}
