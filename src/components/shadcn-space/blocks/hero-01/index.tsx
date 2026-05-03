import HeroSection from "@/components/shadcn-space/blocks/hero-01/hero";
import type { NavigationSection } from "@/components/shadcn-space/blocks/hero-01/header";
import Header from "@/components/shadcn-space/blocks/hero-01/header";
import BrandSlider, { BrandList } from "@/components/shadcn-space/blocks/hero-01/brand-slider";

export default function AgencyHeroSection({
  isAuthenticated,
}: {
  isAuthenticated: boolean;
}) {
  const navigationData: NavigationSection[] = [
    {
      title: "Home",
      href: "#home",
      isActive: true,
    },
    {
      title: "Features",
      href: "#features",
    },
    {
      title: "Pricing",
      href: "#pricing",
    },
    {
      title: "FAQ",
      href: "#faq",
    },
  ];

  const brandList: BrandList[] = [
    {
      label: "Price alerts routed to Telegram",
      context: "Core workflow reliability",
    },
    {
      label: "Trackers with explicit credit limits",
      context: "Transparent monthly usage",
    },
    {
      label: "Built for rapid deal decisions",
      context: "Operator-first product direction",
    },
    {
      label: "No spreadsheet-heavy tracking loops",
      context: "Cleaner monitoring workflow",
    },
    {
      label: "Faster reactions to price movement",
      context: "High-signal notifications",
    },
  ];

  return (
    <div id="home" className="relative">
      <Header navigationData={navigationData} isAuthenticated={isAuthenticated} />
      <main>
        <HeroSection isAuthenticated={isAuthenticated} />
        <BrandSlider brandList={brandList} />
      </main>
    </div>
  );
}
