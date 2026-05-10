import Faq from "@/components/shadcn-space/blocks/faq-01/faq";
import Feature01 from "@/components/shadcn-space/blocks/feature-01";
import Footer from "@/components/shadcn-space/blocks/footer-01/footer";
import AgencyHeroSection from "@/components/shadcn-space/blocks/hero-01";
import Pricing from "@/components/shadcn-space/blocks/pricing-01/pricing";

export default function CopiedLandingPage() {
  return (
    <main className="landing-honey-shell min-h-dvh overflow-x-hidden bg-background font-openrunde text-fg-3 antialiased">
      <section id="home">
        <AgencyHeroSection isAuthenticated={false} />
      </section>

      <section id="features">
        <Feature01 />
      </section>

      <section id="pricing">
        <Pricing
          isAuthenticated={false}
          hasPaidSubscription={false}
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
