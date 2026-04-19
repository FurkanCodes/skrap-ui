import { redirect } from "next/navigation";

import CopiedLandingPage from "@/components/landing/copied-landing-page";
import { getAuthContext } from "@/lib/auth-dal";

export default async function LandingPage() {
  const auth = await getAuthContext();

  if (auth) {
    redirect("/dashboard");
  }

  return <CopiedLandingPage />;
}
