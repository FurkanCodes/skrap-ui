import { Manrope } from "next/font/google";

import Faq from "@/components/shadcn-space/blocks/faq-01/faq";
import Feature01 from "@/components/shadcn-space/blocks/feature-01";
import Footer from "@/components/shadcn-space/blocks/footer-01/footer";
import AgencyHeroSection from "@/components/shadcn-space/blocks/hero-01";
import Pricing from "@/components/shadcn-space/blocks/pricing-01/pricing";

const manrope = Manrope({
  subsets: ["latin"],
  display: "swap",
});

export default function CopiedLandingPage() {
  return (
    <main className={manrope.className}>
      <section id="home">
        <AgencyHeroSection />
      </section>

      <section id="features">
        <Feature01 />
      </section>

      <section id="pricing">
        <Pricing />
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
