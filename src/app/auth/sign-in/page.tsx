import type { Metadata } from "next";

import { AuthForm } from "@/features/auth/components/auth-form";

export const metadata: Metadata = {
  title: "Sign In | Dealvinci",
  description: "Sign in to manage tracked products and alerts.",
};

export default function SignInPage() {
  return <AuthForm mode="sign-in" />;
}
