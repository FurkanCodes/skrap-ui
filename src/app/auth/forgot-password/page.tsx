import type { Metadata } from "next";

import { ForgotPasswordForm } from "@/features/auth/components/forgot-password-form";

export const metadata: Metadata = {
  title: "Forgot Password | Dealvinci",
  description: "Request a password reset link for your Dealvinci account.",
};

export default function ForgotPasswordPage() {
  return <ForgotPasswordForm />;
}

