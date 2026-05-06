"use client";

import {
  IconBellRinging,
  IconCircleCheck,
  IconGauge,
  IconSend,
} from "@tabler/icons-react";
import { motion, useReducedMotion } from "motion/react";

export interface BrandList {
  label: string;
  context: string;
}

const trackerRows = [
  {
    product: "Sony WH-1000XM5",
    store: "Amazon",
    price: "$298.00",
    target: "$289.00",
    status: "Watching",
    tone: "violet",
  },
  {
    product: "Dyson V15 Detect",
    store: "Target",
    price: "$549.99",
    target: "$499.00",
    status: "Alert ready",
    tone: "green",
  },
  {
    product: "LG C3 OLED 55",
    store: "Best Buy",
    price: "$1,196.99",
    target: "$1,099.00",
    status: "Checking",
    tone: "blue",
  },
] as const;

const ProductPreview = () => (
  <div className="mx-auto mt-10 max-w-5xl px-5">
    <div className="relative overflow-hidden rounded-xl bg-bg-a1 px-4 pt-8 shadow-subtle-2 sm:px-8 lg:px-10">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-electric-blue/40 to-transparent" />

      <div className="relative mx-auto flex w-fit max-w-full items-center gap-1 overflow-x-auto rounded-full bg-background px-1.5 py-1.5 shadow-subtle">
        {["Dashboard", "Trackers", "Credits", "Alerts"].map((tab, index) => (
          <span
            key={tab}
            className={
              index === 0
                ? "shrink-0 rounded-full bg-bg-a2 px-3 py-2 text-sm font-semibold leading-none text-fg-4"
                : "shrink-0 rounded-full px-3 py-2 text-sm font-medium leading-none text-fg-1"
            }
          >
            {tab}
          </span>
        ))}
      </div>

      <div className="relative mx-auto mt-7 max-w-5xl rounded-t-xl bg-background p-3 shadow-subtle-3 sm:p-4">
        <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="flex flex-col gap-3 border-b border-light-gray pb-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-caption font-semibold uppercase leading-caption text-muted-gray">
                  Live trackers
                </p>
                <h3 className="mt-1 text-heading-lg font-semibold leading-heading-lg text-fg-4">
                  28 products under watch
                </h3>
              </div>
              <div className="flex w-fit items-center gap-2 rounded-full bg-accent px-3 py-2 text-caption font-semibold leading-none text-fg-4">
              <IconBellRinging className="size-3.5 text-electric-blue" aria-hidden="true" stroke={1.5} />
                Telegram ready
              </div>
            </div>

            <div className="mt-4 space-y-2">
              {trackerRows.map((row) => (
                <div
                  key={row.product}
                  className="grid gap-3 rounded-lg bg-bg-a1 px-4 py-3 transition-colors hover:bg-bg-a2 sm:grid-cols-[1fr_auto_auto]"
                >
                  <div>
                    <p className="text-body font-semibold leading-body text-fg-4">
                      {row.product}
                    </p>
                    <p className="text-caption leading-caption text-fg-1">
                      {row.store}
                    </p>
                  </div>
                  <div className="flex gap-5 text-body leading-body sm:justify-end">
                    <span className="font-semibold text-fg-4">{row.price}</span>
                    <span className="text-fg-1">Target {row.target}</span>
                  </div>
                  <span
                    className={
                      row.tone === "green"
                        ? "w-fit rounded-full bg-pale-mint px-3 py-1 text-caption font-semibold leading-none text-fg-4"
                        : row.tone === "blue"
                          ? "w-fit rounded-full bg-electric-blue/12 px-3 py-1 text-caption font-semibold leading-none text-electric-blue"
                          : "w-fit rounded-full bg-bg-a2 px-3 py-1 text-caption font-semibold leading-none text-purple-4"
                    }
                  >
                    {row.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-4">
            <div className="rounded-lg bg-bg-a1 p-4">
              <div className="flex items-center justify-between">
                <p className="text-caption font-semibold uppercase leading-caption text-muted-gray">
                  Credits
                </p>
                  <IconGauge className="size-4 text-electric-blue" aria-hidden="true" stroke={1.5} />
              </div>
              <p className="mt-4 text-4xl font-semibold leading-none text-fg-4">7,420</p>
              <p className="mt-2 text-body leading-body text-fg-3">
                available this cycle
              </p>
              <div className="mt-5 h-2 overflow-hidden rounded-full bg-light-gray">
                <div className="h-full w-[74%] rounded-full bg-electric-blue" />
              </div>
            </div>

            <div className="rounded-lg bg-slate-ink p-4 text-canvas-white">
              <div className="flex items-center gap-2">
                  <IconSend className="size-4 text-electric-blue" aria-hidden="true" stroke={1.5} />
                <p className="text-caption font-semibold uppercase leading-caption text-canvas-white/58">
                  Last alert
                </p>
              </div>
              <p className="mt-4 text-heading-sm font-semibold leading-heading-sm">
                Target reached on headphones
              </p>
              <p className="mt-2 text-body leading-body text-canvas-white/64">
                Delivered to Telegram 2 minutes ago.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

function BrandSlider({ brandList }: { brandList: BrandList[] }) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <section className="bg-background pb-14 font-openrunde">
      <motion.div
        initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={
          shouldReduceMotion
            ? { duration: 0 }
            : { duration: 0.58, ease: [0.22, 1, 0.36, 1] }
        }
        className="mx-auto max-w-5xl px-5"
      >
        <div className="flex flex-wrap items-center justify-center gap-3 text-center text-fg-3">
          {brandList.map((brand) => (
            <div
              key={brand.label}
              className="flex items-center gap-2 rounded-full bg-bg-a1 px-4 py-2"
            >
                  <IconCircleCheck className="size-4 text-electric-blue" aria-hidden="true" stroke={1.5} />
              <span className="text-body font-semibold leading-body">{brand.label}</span>
            </div>
          ))}
        </div>
      </motion.div>

      <ProductPreview />
    </section>
  );
}

export default BrandSlider;
