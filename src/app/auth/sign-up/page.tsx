import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AuthForm } from "@/features/auth/components/auth-form";
import { getAuthContext } from "@/lib/auth-dal";

export const metadata: Metadata = {
  title: "Sign Up | Dealvinci",
  description: "Create an account for tracker ownership and notifications.",
};

export default async function SignUpPage() {
  const auth = await getAuthContext();
  if (auth) {
    redirect("/dashboard");
  }

  return <AuthForm mode="sign-up" />;
}
