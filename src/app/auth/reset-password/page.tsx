import type { Metadata } from "next";

import { ResetPasswordForm } from "@/features/auth/components/reset-password-form";

export const metadata: Metadata = {
  title: "Reset Password | Dealvinci",
  description: "Set a new password for your Dealvinci account.",
};

export default function ResetPasswordPage() {
  return <ResetPasswordForm />;
}

