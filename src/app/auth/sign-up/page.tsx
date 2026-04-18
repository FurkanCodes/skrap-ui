import type { Metadata } from "next";

import { AuthForm } from "@/features/auth/components/auth-form";

export const metadata: Metadata = {
  title: "Sign Up | Skrap UI",
  description: "Create an account for tracker ownership and notifications.",
};

export default function SignUpPage() {
  return <AuthForm mode="sign-up" />;
}
