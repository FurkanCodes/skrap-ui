import { Manrope } from "next/font/google";

import Faq from "@/components/shadcn-space/blocks/faq-01/faq";
import Feature01 from "@/components/shadcn-space/blocks/feature-01";
import Footer from "@/components/shadcn-space/blocks/footer-01/footer";
import AgencyHeroSection from "@/components/shadcn-space/blocks/hero-01";
import Pricing from "@/components/shadcn-space/blocks/pricing-01/pricing";
import { getBillingCurrentQuery } from "@/features/billing/server/queries";
import { getAuthContext } from "@/lib/auth-dal";

const manrope = Manrope({
  subsets: ["latin"],
  display: "swap",
});

const ACTIVE_PADDLE_STATUSES = new Set(["active", "trialing", "past_due"]);

export default async function CopiedLandingPage() {
  const auth = await getAuthContext();
  const isAuthenticated = Boolean(auth);
  let hasPaidSubscription = false;

  if (isAuthenticated) {
    try {
      const billing = await getBillingCurrentQuery();
      hasPaidSubscription = Boolean(
        billing.subscription?.provider === "paddle" &&
          billing.subscription.provider_subscription_id &&
          ACTIVE_PADDLE_STATUSES.has(billing.subscription.status)
      );
    } catch {
      hasPaidSubscription = false;
    }
  }

  return (
    <main className={manrope.className}>
      <section id="home">
        <AgencyHeroSection isAuthenticated={isAuthenticated} />
      </section>

      <section id="features">
        <Feature01 />
      </section>

      <section id="pricing">
        <Pricing
          isAuthenticated={isAuthenticated}
          hasPaidSubscription={hasPaidSubscription}
        />
      </section>

      <section id="faq">
        <Faq />
      </section>

      <section id="contact">
        <Footer />
      </section>
    </main>
  );
}
