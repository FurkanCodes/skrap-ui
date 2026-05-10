"use client";

import type { Icon } from "@tabler/icons-react";
import {
  IconArrowRight,
  IconArrowsSort,
  IconBellRinging,
  IconCircleCheck,
  IconGauge,
  IconLink,
  IconSend,
} from "@tabler/icons-react";
import { motion, useReducedMotion } from "motion/react";

import { cn } from "@/lib/utils";

type Benefit = {
  icon: Icon;
  title: string;
  detail: string;
};

type FeatureStory = {
  icon: Icon;
  eyebrow: string;
  title: string;
  detail: string;
  chips: string[];
  visual: "tracker" | "alert" | "credits";
  surfaceClassName: string;
};

const benefits: Benefit[] = [
  {
    icon: IconLink,
    title: "Paste a URL.",
    detail: "Start a tracker without manual setup.",
  },
  {
    icon: IconBellRinging,
    title: "Set the target.",
    detail: "Only alert when the deal matters.",
  },
  {
    icon: IconGauge,
    title: "Watch credits.",
    detail: "Keep usage visible as you scale.",
  },
];

const stories: FeatureStory[] = [
  {
    icon: IconArrowsSort,
    eyebrow: "Track prices",
    title: "Know when a product is close enough to buy",
    detail: "Monitor the current price, target line, and last check in one calm product card.",
    chips: ["Target price", "Store status", "Last checked"],
    visual: "tracker",
    surfaceClassName: "bg-landing-soft-blue",
  },
  {
    icon: IconBellRinging,
    eyebrow: "Telegram alerts",
    title: "Get the signal when the price crosses your line",
    detail: "Notifications stay scarce, specific, and tied to the tracker that triggered them.",
    chips: ["Target hit", "Telegram", "Direct link"],
    visual: "alert",
    surfaceClassName: "bg-landing-paper",
  },
  {
    icon: IconGauge,
    eyebrow: "Credit control",
    title: "See tracker volume before it eats the plan",
    detail: "Credits, active trackers, and check frequency stay visible before the watchlist grows.",
    chips: ["Monthly credits", "Tracker caps", "Check frequency"],
    visual: "credits",
    surfaceClassName: "bg-landing-soft-green",
  },
];

const trackerRows = [
  { store: "Amazon", item: "Sony WH-1000XM5", price: "$298", target: "$289", progress: 0.84 },
  { store: "Best Buy", item: "LG C3 OLED", price: "$1,196", target: "$1,099", progress: 0.68 },
  { store: "Apple", item: "iPad Air 11", price: "$529", target: "$529", progress: 1 },
];

const usageRows = [
  { label: "Active trackers", value: "126" },
  { label: "Checks today", value: "384" },
  { label: "Fastest interval", value: "30m" },
];

const easeOut = [0.22, 1, 0.36, 1] as const;

const Feature = () => {
  const shouldReduceMotion = useReducedMotion();

  const reveal = (index = 0) => ({
    initial: { y: shouldReduceMotion ? 0 : 24, opacity: 0 },
    whileInView: { y: 0, opacity: 1 },
    viewport: { once: true, margin: "-120px" },
    transition: shouldReduceMotion
      ? { duration: 0 }
      : { delay: index * 0.06, duration: 0.62, ease: easeOut },
  });

  return (
    <section className="bg-landing-card py-12 font-openrunde sm:py-14 lg:py-16">
      <div className="mx-auto grid w-full max-w-5xl grid-cols-1 gap-3 px-5 sm:grid-cols-3">
        {benefits.map((benefit, index) => {
          const Icon = benefit.icon;

          return (
            <motion.article
              key={benefit.title}
              {...reveal(index)}
              className="flex items-center gap-3 rounded-[28px] bg-landing-soft-gray p-3 pr-4"
            >
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-landing-yellow-strong text-landing-ink">
                <Icon className="size-5" aria-hidden="true" stroke={1.6} />
              </span>
              <p className="text-body/5 font-medium text-fg-3">
                <span className="font-semibold text-fg-4">{benefit.title}</span>{" "}
                {benefit.detail}
              </p>
            </motion.article>
          );
        })}
      </div>

      <div className="mx-auto mt-12 w-full max-w-7xl px-5 lg:mt-14">
        <motion.div {...reveal()} className="mx-auto flex max-w-7xl flex-col items-center gap-4 text-center">
          <span className="rounded-full bg-landing-yellow-strong px-3 py-1.5 text-caption font-bold uppercase leading-none text-landing-ink">
            Features
          </span>
          <h2 className="max-w-none text-5xl/14 font-semibold text-fg-4 md:text-balance lg:text-6xl/17 xl:whitespace-nowrap">
            Simple signals for every product you watch
          </h2>
        </motion.div>

        <div className="mt-9 flex flex-col gap-10 lg:mt-10 lg:gap-12">
          {stories.map((story, index) => (
            <FeatureStoryBlock
              key={story.title}
              story={story}
              index={index}
              shouldReduceMotion={shouldReduceMotion}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

const FeatureStoryBlock = ({
  story,
  index,
  shouldReduceMotion,
}: {
  story: FeatureStory;
  index: number;
  shouldReduceMotion: boolean | null;
}) => {
  const Icon = story.icon;

  return (
    <article className="grid items-center gap-6 md:grid-cols-[0.92fr_1.08fr] md:gap-8 lg:gap-10">
      <motion.div
        initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-120px" }}
        transition={
          shouldReduceMotion
            ? { duration: 0 }
            : { delay: 0.05, duration: 0.58, ease: easeOut }
        }
        className="w-full"
      >
        <div className="flex items-center gap-3">
          <span className="flex size-11 items-center justify-center rounded-full bg-landing-soft-gray text-landing-ink">
            <Icon className="size-5" aria-hidden="true" stroke={1.7} />
          </span>
          <span className="text-sm font-semibold uppercase tracking-[0.07em] text-fg-4">
            {story.eyebrow}
          </span>
        </div>

        <h3 className="mt-4 max-w-xl text-5xl/14 font-semibold text-fg-4 md:text-balance lg:text-6xl/17">
          {story.title}
        </h3>
        <p className="mt-3 w-full max-w-lg text-lg/6 font-medium text-fg-3">
          {story.detail}
        </p>

        <div className="mt-5 flex flex-wrap gap-2">
          {story.chips.map((chip) => (
            <span
              key={chip}
              className="rounded-full bg-landing-soft-gray px-4 py-2 text-sm font-semibold leading-none text-landing-ink"
            >
              {chip}
            </span>
          ))}
        </div>

        {index === 0 ? (
          <a
            href="#pricing"
            className="mt-5 inline-flex h-11 items-center justify-center gap-2 rounded-full border border-landing-ink bg-transparent px-5 text-sm font-bold leading-none text-landing-ink transition-colors hover:bg-landing-ink hover:text-landing-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-landing-ink/50"
          >
            See plans
            <IconArrowRight className="size-4" aria-hidden="true" stroke={1.5} />
          </a>
        ) : null}
      </motion.div>

      <motion.div
        initial={{
          opacity: 0,
          y: shouldReduceMotion ? 0 : 44,
          scale: shouldReduceMotion ? 1 : 0.97,
        }}
        whileInView={{ opacity: 1, y: 0, scale: 1 }}
        viewport={{ once: true, margin: "-160px" }}
        transition={
          shouldReduceMotion
            ? { duration: 0 }
            : { duration: 0.72, ease: easeOut }
        }
        className={cn(
          "relative overflow-hidden rounded-[28px] p-4 sm:p-5 lg:p-6",
          story.surfaceClassName,
        )}
      >
        <ProductPreview type={story.visual} shouldReduceMotion={shouldReduceMotion} />
      </motion.div>
    </article>
  );
};

const ProductPreview = ({
  type,
  shouldReduceMotion,
}: {
  type: FeatureStory["visual"];
  shouldReduceMotion: boolean | null;
}) => {
  if (type === "alert") {
    return (
      <div className="relative min-h-[360px] overflow-hidden rounded-[24px] bg-landing-card p-4 sm:p-5">
        <div className="flex items-center justify-between">
          <span className="rounded-full bg-landing-soft-gray px-3 py-1.5 text-xs font-bold uppercase leading-none text-landing-muted">
            Telegram
          </span>
          <span className="rounded-full bg-landing-yellow-strong px-3 py-1.5 text-xs font-bold leading-none text-landing-ink">
            now
          </span>
        </div>

        <motion.div
          initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 26 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={shouldReduceMotion ? { duration: 0 } : { delay: 0.14, duration: 0.54, ease: easeOut }}
          className="mx-auto mt-10 max-w-md rounded-[22px] bg-landing-ink p-4 text-landing-card sm:mt-12 sm:p-5"
        >
          <div className="flex items-start gap-3">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-landing-yellow-strong text-landing-ink">
              <IconSend className="size-5" aria-hidden="true" stroke={1.7} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold leading-5">Target price hit</p>
              <p className="mt-1 text-sm leading-5 text-landing-card/70">
                iPad Air 11 reached $529 at Apple.
              </p>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-3 gap-2">
            {[
              ["Current", "$529"],
              ["Target", "$529"],
              ["Saved", "$70"],
            ].map(([label, value]) => (
              <div key={label} className="rounded-2xl bg-white/10 px-3 py-2">
                <p className="text-[11px] font-semibold text-landing-card/55">
                  {label}
                </p>
                <p className="mt-1 text-sm font-bold">{value}</p>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: shouldReduceMotion ? 0 : 28 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={shouldReduceMotion ? { duration: 0 } : { delay: 0.28, duration: 0.58, ease: easeOut }}
          className="absolute bottom-5 right-5 hidden rounded-[20px] bg-landing-soft-gray p-4 sm:block"
        >
          <p className="text-xs font-bold uppercase text-landing-muted">Next check</p>
          <p className="mt-1 text-2xl font-semibold text-landing-ink">
            30 min
          </p>
        </motion.div>
      </div>
    );
  }

  if (type === "credits") {
    return (
      <div className="relative min-h-[360px] overflow-hidden rounded-[24px] bg-landing-card p-4 sm:p-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.07em] text-landing-muted">
              Monthly credits
            </p>
            <p className="mt-2 text-6xl font-semibold leading-none text-landing-ink">
              7,420
            </p>
          </div>
          <span className="rounded-full bg-landing-yellow-strong px-4 py-2 text-sm font-bold leading-none text-landing-ink">
            74% left
          </span>
        </div>

        <div className="mt-7 overflow-hidden rounded-full bg-landing-soft-gray p-1.5">
          <motion.div
            className="h-8 origin-left rounded-full bg-landing-ink"
            initial={{ scaleX: shouldReduceMotion ? 0.74 : 0.38 }}
            whileInView={{ scaleX: 0.74 }}
            viewport={{ once: true }}
            transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.9, ease: easeOut }}
          />
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          {usageRows.map((row) => (
            <div key={row.label} className="rounded-[22px] bg-landing-soft-gray p-4">
              <p className="text-xs font-bold uppercase leading-none text-landing-muted">
                {row.label}
              </p>
              <p className="mt-3 text-3xl font-semibold leading-none text-landing-ink">
                {row.value}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-4 rounded-[20px] bg-landing-ink p-4 text-landing-card">
          <div className="flex items-center justify-between gap-4">
            <span className="text-sm font-semibold">Pro plan capacity</span>
            <span className="text-sm font-bold text-landing-yellow-strong">
              steady
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-[360px] overflow-hidden rounded-[24px] bg-landing-card p-3.5 sm:p-4">
      <div className="flex items-center justify-between rounded-[18px] bg-landing-soft-gray px-3.5 py-2.5">
        <div className="flex items-center gap-2">
          <span className="size-3 rounded-full bg-landing-ink" />
          <span className="text-sm font-bold text-landing-ink">Price board</span>
        </div>
        <button
          type="button"
          className="rounded-full bg-landing-yellow-strong px-3 py-1.5 text-xs font-bold leading-none text-landing-ink"
        >
          + New
        </button>
      </div>

      <div className="mt-4 space-y-2.5">
        {trackerRows.map((row, index) => {
          const isHit = row.progress === 1;

          return (
            <motion.div
              key={row.item}
              initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={
                shouldReduceMotion
                  ? { duration: 0 }
                  : { delay: 0.1 + index * 0.08, duration: 0.48, ease: easeOut }
              }
              className="rounded-[18px] border border-[#e0e5e7] bg-white p-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-base font-semibold text-landing-ink">
                    {row.item}
                  </p>
                  <p className="mt-1 text-xs font-bold uppercase leading-none text-landing-muted">
                    {row.store}
                  </p>
                </div>
                <span
                  className={cn(
                    "shrink-0 rounded-full px-3 py-1.5 text-xs font-bold leading-none",
                    isHit
                      ? "bg-landing-yellow-strong text-landing-ink"
                      : "bg-landing-soft-gray text-landing-muted",
                  )}
                >
                  {isHit ? "Hit" : "Watching"}
                </span>
              </div>

              <div className="mt-3 grid grid-cols-[1fr_auto_auto] items-center gap-3">
                <div className="h-2.5 overflow-hidden rounded-full bg-landing-soft-gray">
                  <motion.div
                    className="h-full origin-left rounded-full bg-landing-ink"
                    initial={{ scaleX: shouldReduceMotion ? row.progress : 0.28 }}
                    whileInView={{ scaleX: row.progress }}
                    viewport={{ once: true }}
                    transition={shouldReduceMotion ? { duration: 0 } : { delay: 0.18 + index * 0.08, duration: 0.82, ease: easeOut }}
                  />
                </div>
                <span className="text-sm font-semibold text-landing-ink">
                  {row.price}
                </span>
                <span className="text-sm font-semibold text-landing-muted">
                  {row.target}
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="mt-3 flex items-center gap-2 rounded-[18px] bg-landing-ink p-3 text-landing-card">
        <IconCircleCheck className="size-5 text-landing-yellow-strong" aria-hidden="true" stroke={1.7} />
        <p className="text-sm font-semibold">iPad Air crossed its target line.</p>
      </div>
    </div>
  );
};

export default Feature;
