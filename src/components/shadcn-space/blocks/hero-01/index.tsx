import HeroSection from "@/components/shadcn-space/blocks/hero-01/hero";
import type { NavigationSection } from "@/components/shadcn-space/blocks/hero-01/header";
import Header from "@/components/shadcn-space/blocks/hero-01/header";
import BrandSlider, { type BrandList } from "@/components/shadcn-space/blocks/hero-01/brand-slider";

export default function AgencyHeroSection({
  isAuthenticated,
}: {
  isAuthenticated: boolean;
}) {
  const navigationData: NavigationSection[] = [
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
      label: "Telegram alerts",
      context: "Delivered when target prices hit",
    },
    {
      label: "Credit control",
      context: "Transparent monthly usage",
    },
    {
      label: "Fast tracker setup",
      context: "URL to monitoring in minutes",
    },
    {
      label: "Margin-first workflow",
      context: "Built for sourcing decisions",
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
