"use client";
import Feature from "@/components/shadcn-space/blocks/feature-01/feature";
import { ArrowDownUp, BellRing, Gauge, ShieldCheck } from "lucide-react";

const featureData = [
  {
    icon: ArrowDownUp,
    content: "Track hundreds of product URLs with one clean dashboard and no spreadsheet chaos.",
  },
  {
    icon: BellRing,
    content: "Get instant Telegram alerts when your target price hits, not hours later.",
  },
  {
    icon: Gauge,
    content: "Spend credits where it matters most with tier-based limits and flexible check frequency.",
  },
  {
    icon: ShieldCheck,
    content: "Run reliable monitoring with clear statuses, retry logic, and transparent tracker controls.",
  },
];

const Feature01 = () => {
  return <Feature featureData={featureData} />;
};

export default Feature01;
