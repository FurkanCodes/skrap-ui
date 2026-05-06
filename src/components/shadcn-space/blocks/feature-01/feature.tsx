"use client";

import type { Icon } from "@tabler/icons-react";
import {
  IconArrowRight,
  IconArrowsSort,
  IconBellRinging,
  IconCircleCheck,
  IconGauge,
  IconSend,
  IconShieldCheck,
} from "@tabler/icons-react";
import { motion, useReducedMotion } from "motion/react";

type Benefit = {
  icon: Icon;
  title: string;
  detail: string;
};

type FeatureCard = {
  accent: string;
  icon: Icon;
  title: string;
  description: string;
  bullets: string[];
  visual: "trackers" | "alerts" | "credits" | "timeline";
};

const benefits: Benefit[] = [
  {
    icon: IconArrowsSort,
    title: "Paste a URL.",
    detail: "Turn any product page into a live tracker in seconds.",
  },
  {
    icon: IconBellRinging,
    title: "Target-price alerts.",
    detail: "Get Telegram pings when a deal is ready.",
  },
  {
    icon: IconGauge,
    title: "Credits stay clear.",
    detail: "See usage before checks eat your monthly plan.",
  },
];

const featureCards: FeatureCard[] = [
  {
    accent: "text-electric-blue",
    icon: IconArrowsSort,
    title: "Price drop tracking",
    description: "Watch the products your team cares about and compare current price against target.",
    bullets: ["Target price rules", "Store-aware checks", "Current vs target view"],
    visual: "trackers",
  },
  {
    accent: "text-radiant-violet",
    icon: IconBellRinging,
    title: "Telegram alerts",
    description: "Send the right signal when a tracker crosses the line your team set.",
    bullets: ["Instant delivery", "Only when target hits", "Direct link back to tracker"],
    visual: "alerts",
  },
  {
    accent: "text-success-green",
    icon: IconGauge,
    title: "Credit control",
    description: "Keep check frequency and monthly usage visible before the budget gets noisy.",
    bullets: ["Monthly credit balance", "Plan-based tracker limits", "Frequency control"],
    visual: "credits",
  },
  {
    accent: "text-warning-yellow",
    icon: IconShieldCheck,
    title: "Reliable monitoring",
    description: "Give operators clear status, history, and retry signals for every tracked product.",
    bullets: ["Last check status", "Retry-friendly workflow", "Price movement timeline"],
    visual: "timeline",
  },
];

const trackerRows = [
  { store: "Amazon", item: "Sony WH-1000XM5", price: "$298", target: "$289", width: "82%" },
  { store: "Best Buy", item: "LG C3 OLED", price: "$1,196", target: "$1,099", width: "68%" },
  { store: "Apple", item: "iPad Air 11", price: "$549", target: "$529", width: "54%" },
  { store: "B&H", item: "Canon R8 Kit", price: "$1,399", target: "$1,299", width: "42%" },
  { store: "Walmart", item: "Dyson V15", price: "$579", target: "$549", width: "33%" },
];

const timelineRows = [
  { label: "Checked now", value: "$298", tone: "bg-electric-blue" },
  { label: "Target matched", value: "$289", tone: "bg-success-green" },
  { label: "Retry queued", value: "2m", tone: "bg-warning-yellow" },
  { label: "Previous check", value: "$314", tone: "bg-radiant-violet" },
];

const easeOut = [0.22, 1, 0.36, 1] as const;

const Feature = () => {
  const shouldReduceMotion = useReducedMotion();

  const reveal = (index = 0) => ({
    initial: { y: shouldReduceMotion ? 0 : 22, opacity: 0 },
    whileInView: { y: 0, opacity: 1 },
    viewport: { once: true, margin: "-80px" },
    transition: shouldReduceMotion
      ? { duration: 0 }
      : { delay: index * 0.06, duration: 0.56, ease: easeOut },
  });

  return (
    <section className="bg-background py-16 font-openrunde">
      <div className="w-full max-w-5xl mx-auto px-5 grid sm:grid-cols-2 md:grid-cols-3 gap-x-8 gap-y-12 justify-center md:justify-start">
        {benefits.map((benefit, index) => {
          const Icon = benefit.icon;

          return (
            <motion.div
              key={benefit.title}
              {...reveal(index)}
              className="flex flex-col items-center justify-start gap-3 max-w-xs md:max-w-none"
            >
              <div className="w-10 h-9 rounded-full corner-superellipse/1.125 bg-bg-a1 flex items-center justify-center">
                <Icon className="size-5 text-electric-blue" aria-hidden="true" stroke={1.5} />
              </div>
              <h3 className="text-lg/6 font-medium text-center text-fg-4">
                {benefit.title} <span className="text-fg-3">{benefit.detail}</span>
              </h3>
            </motion.div>
          );
        })}
      </div>

      <div className="w-full max-w-5xl px-5 mx-auto py-16 flex flex-col gap-12">
        <motion.div {...reveal()} className="flex flex-col items-center text-center gap-5">
          <span className="flex items-center justify-center border font-medium w-fit whitespace-nowrap [&>svg]:pointer-events-none ring-ring/10 dark:ring-ring/20 dark:outline-ring/40 outline-ring/50 focus-visible:ring-4 focus-visible:outline-1 aria-invalid:focus-visible:ring-0 transition-[color,box-shadow] border-transparent bg-bg-a1 text-fg-3 h-[24px] min-w-[24px] text-sm pl-2 pr-2 gap-1 rounded-sm">
            Features
          </span>
          <h2 className="text-4xl tracking-tighter text-fg-4 leading-11 font-medium text-balance max-w-lg">
            Everything you need to track prices with confidence
          </h2>
          <p className="w-full max-w-md font-medium text-lg/6 text-fg-3">
            Create trackers, control check frequency, and get useful alerts without babysitting
            product pages.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {featureCards.map((feature, index) => {
            const Icon = feature.icon;

            return (
              <motion.article
                key={feature.title}
                {...reveal(index)}
                className="flex flex-col bg-bg-a1 rounded-xl min-h-[280px] overflow-hidden"
              >
                <div className="flex flex-col p-6 px-8 gap-3 items-start">
                  <span className="w-10 h-9 rounded-full corner-superellipse/1.125 bg-background flex items-center justify-center">
                    <Icon className={`size-5 ${feature.accent}`} aria-hidden="true" stroke={1.5} />
                  </span>
                  <div className="flex flex-col gap-0.5 max-w-72">
                    <h3 className={`text-2xl/7 font-medium ${feature.accent}`}>
                      {feature.title}
                    </h3>
                    <p className="text-2xl/7 font-medium text-fg-4">{feature.description}</p>
                  </div>
                  <ul className="list-none flex flex-col gap-1">
                    {feature.bullets.map((bullet) => (
                      <li key={bullet} className="flex items-center gap-2">
                        <IconCircleCheck
                          className={`size-4 ${feature.accent}`}
                          aria-hidden="true"
                          stroke={1.5}
                        />
                        <span className="text-sm font-medium text-fg-4">{bullet}</span>
                      </li>
                    ))}
                  </ul>
                  <a
                    href="#pricing"
                    className="select-none flex items-center relative cursor-pointer justify-center whitespace-nowrap font-medium transition-all corner-superellipse/1.125 bg-background text-fg-4 shadow-subtle-2 hover:shadow-subtle active:bg-bg-2 h-[32px] px-2.5 text-sm rounded-full active:scale-99 gap-1 pr-1.5 mt-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-electric-blue/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                  >
                    See pricing
                    <IconArrowRight className="size-4" aria-hidden="true" stroke={1.25} />
                  </a>
                </div>
                <FeatureVisual
                  type={feature.visual}
                  accent={feature.accent}
                  shouldReduceMotion={shouldReduceMotion}
                />
              </motion.article>
            );
          })}

          <motion.div
            {...reveal(4)}
            className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            <article className="bg-bg-a1 rounded-xl">
              <div className="flex p-6 px-8 gap-3 justify-between items-center">
                <div className="flex flex-col gap-1">
                  <h3 className="text-lg font-medium text-fg-4">Clean setup</h3>
                  <p className="max-w-72 text-fg-3">
                    No spreadsheet drift. Paste, set target, and watch from one calm dashboard.
                  </p>
                </div>
                <IconArrowsSort className="size-16 text-electric-blue/35" aria-hidden="true" stroke={1.3} />
              </div>
            </article>
            <article className="bg-bg-a1 rounded-xl">
              <div className="flex p-6 px-8 gap-3 justify-between items-center">
                <div className="flex flex-col gap-1">
                  <h3 className="text-lg font-medium text-fg-4">Team-ready signals</h3>
                  <p className="max-w-72 text-fg-3">
                    Clear statuses, useful alerts, and predictable checks for fast buying calls.
                  </p>
                </div>
                <IconSend className="size-16 text-radiant-violet/35" aria-hidden="true" stroke={1.3} />
              </div>
            </article>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

const FeatureVisual = ({
  type,
  accent,
  shouldReduceMotion,
}: {
  type: FeatureCard["visual"];
  accent: string;
  shouldReduceMotion: boolean | null;
}) => {
  if (type === "trackers") {
    return (
      <div className="w-full h-[320px] flex items-end relative overflow-hidden p-6 px-8 pt-0">
        <div className="w-full flex flex-col gap-1">
          {trackerRows.map((row) => (
            <div key={row.item} className="flex group relative h-9 items-center w-full overflow-hidden">
              <div className="absolute inset-0 flex items-center gap-[3px]">
                <div
                  className="h-full pointer-events-none transform-gpu bg-bg-a2 transition-[width] duration-300 ease-out rounded-l-md"
                  style={{ width: row.width }}
                />
                <div className="h-full pointer-events-none transform-gpu bg-electric-blue/20 transition-[width] duration-300 ease-out rounded-r-md" style={{ width: "18%" }} />
              </div>
              <div className="relative z-10 flex items-center w-full gap-2 pl-2.5 pr-3">
                <div className="size-4 shrink-0 rounded-full bg-background shadow-subtle-2" />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-fg-4">{row.item}</div>
                  <div className="truncate text-xs text-fg-3">{row.store}</div>
                </div>
                <span className="shrink-0 text-sm font-medium text-fg-4">{row.price}</span>
                <span className="hidden shrink-0 text-xs text-fg-3 sm:inline">{row.target}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (type === "alerts") {
    return (
      <div className="w-full h-[320px] relative overflow-hidden p-6 px-8 pt-0 flex items-end">
        <div className="absolute left-10 right-10 top-8 h-48 rounded-full bg-radiant-violet/15 blur-3xl" />
        <div className="relative w-full rounded-[24px] bg-background px-5 py-4 shadow-subtle-3">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-full bg-radiant-violet/15 text-radiant-violet">
              <IconSend className="size-5" aria-hidden="true" stroke={1.5} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-fg-4">Telegram alert sent</p>
              <p className="truncate text-sm text-fg-3">Sony WH-1000XM5 reached $289 target</p>
            </div>
            <span className="text-xs font-medium text-success-green">now</span>
          </div>
          <div className="mt-5 grid grid-cols-3 gap-2">
            {["Current", "Target", "Saved"].map((label, index) => (
              <div key={label} className="rounded-lg bg-bg-a1 px-3 py-2">
                <p className="text-xs text-fg-3">{label}</p>
                <p className="mt-1 text-sm font-medium text-fg-4">
                  {index === 0 ? "$289" : index === 1 ? "$289" : "$41"}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (type === "credits") {
    return (
      <div className="w-full h-[320px] p-6 px-8 pt-0 flex flex-col justify-end gap-5">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-sm font-medium text-fg-3">Monthly credits</p>
            <p className="mt-1 text-5xl font-medium text-fg-4">7,420</p>
          </div>
          <span className="rounded-full bg-success-green/15 px-3 py-1 text-sm font-medium text-success-green">
            74% left
          </span>
        </div>
        <div className="h-8 overflow-hidden rounded-full bg-bg-a2">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-electric-blue to-success-green"
            initial={{ width: shouldReduceMotion ? "74%" : "38%" }}
            whileInView={{ width: "74%" }}
            viewport={{ once: true }}
            transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.9, ease: easeOut }}
          />
        </div>
        <div className="grid grid-cols-3 gap-2 text-center">
          {[
            ["126", "trackers"],
            ["15m", "checks"],
            ["Pro", "plan"],
          ].map(([value, label]) => (
            <div key={label} className="rounded-lg bg-background px-3 py-2">
              <p className="text-sm font-medium text-fg-4">{value}</p>
              <p className="text-xs text-fg-3">{label}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-[320px] p-6 px-8 pt-0 flex flex-col justify-end gap-3">
      <div className="flex items-center gap-2 font-medium text-fg-4">
        <IconShieldCheck className={`size-4 ${accent}`} aria-hidden="true" stroke={1.5} />
        Last activity
      </div>
      <div className="flex flex-col gap-2">
        {timelineRows.map((row) => (
          <div key={row.label} className="flex h-11 items-center gap-3 rounded-lg bg-background px-3">
            <span className={`size-2.5 rounded-full ${row.tone}`} />
            <span className="min-w-0 flex-1 truncate text-sm font-medium text-fg-4">
              {row.label}
            </span>
            <span className="text-sm text-fg-3">{row.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Feature;
