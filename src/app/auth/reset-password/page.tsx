import type { Metadata } from "next";

import { ResetPasswordForm } from "@/features/auth/components/reset-password-form";
import { getMessages } from "@/lib/messages";

export function generateMetadata(): Metadata {
  const t = getMessages("auth.meta.resetPassword");
  return {
    title: t("title"),
    description: t("description"),
  };
}

export default function ResetPasswordPage() {
  return <ResetPasswordForm />;
}
