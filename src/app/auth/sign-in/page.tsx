import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AuthForm } from "@/features/auth/components/auth-form";
import { getAuthContext } from "@/lib/auth-dal";

export const metadata: Metadata = {
  title: "Sign In | Dealvinci",
  description: "Sign in to manage tracked products and alerts.",
};

export default async function SignInPage() {
  const auth = await getAuthContext();
  if (auth) {
    redirect("/dashboard");
  }

  return <AuthForm mode="sign-in" />;
}
