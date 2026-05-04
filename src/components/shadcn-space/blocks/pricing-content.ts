export interface MarketingPricingPlan {
  planKey: "free" | "plus" | "pro";
  surfaceClassName: string;
  name: string;
  description: string;
  price: number;
  ctaLabel: string;
  features: readonly string[];
  highlight?: string;
}

export const MARKETING_PRICING_PLANS: readonly MarketingPricingPlan[] = [
  {
    planKey: "free",
    surfaceClassName: "bg-[#00000008]",
    name: "Free",
    description: "For shoppers tracking a few high-intent products without the pressure to upgrade fast.",
    price: 0,
    ctaLabel: "Start free",
    features: [
      "100 credits / month",
      "Up to 5 active trackers",
      "Check as often as every 12 hours",
      "Telegram alerts",
    ],
  },
  {
    planKey: "plus",
    surfaceClassName: "bg-whisper-purple/55",
    name: "Plus",
    description: "For regular deal hunters who want more coverage, faster checks, and a simple monthly upgrade.",
    price: 9,
    ctaLabel: "Choose Plus",
    highlight: "Most popular",
    features: [
      "10,000 credits / month",
      "Up to 25 active trackers",
      "Check as often as every 2 hours",
      "Telegram alerts",
    ],
  },
  {
    planKey: "pro",
    surfaceClassName: "bg-pale-mint/70",
    name: "Pro",
    description: "For power users covering more stores, more products, and faster-moving opportunities.",
    price: 19,
    ctaLabel: "Choose Pro",
    features: [
      "50,000 credits / month",
      "Up to 100 active trackers",
      "Check as often as every 30 minutes",
      "Telegram alerts",
    ],
  },
] as const;

const planNamesLabel = "Free, Plus, and Pro";

export const MARKETING_PRICING_FAQ = [
  {
    question: "How do credits work in Dealvinci?",
    answer:
      "Each check run consumes credits based on fetch complexity and volume. Your monthly plan includes a credit allowance, and usage resets each billing cycle.",
  },
  {
    question: "What happens when I run out of credits?",
    answer:
      "Trackers pause when available credits are exhausted. You can upgrade to a higher tier for more monthly capacity or wait for your next billing reset.",
  },
  {
    question: "Can I switch tiers anytime?",
    answer: `Yes. You can move between ${planNamesLabel} at any time. Upgrades apply immediately, and downgrades apply on the next billing cycle.`,
  },
  {
    question: "Do all plans include Telegram alerts?",
    answer:
      "Yes. All current plans include Telegram alerts, so you can keep notifications in one place as your tracking volume grows.",
  },
  {
    question: "Who is Dealvinci best for?",
    answer:
      "Dealvinci is built for deal hunters, sourcing operators, and ecommerce teams who need dependable price monitoring without manual tab checking.",
  },
] as const;
