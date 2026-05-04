"use client";

import { BellRing, CheckCircle2, Gauge, Send } from "lucide-react";
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
  <div className="mx-auto mt-12 max-w-6xl px-4 sm:px-6 lg:px-8">
    <div className="relative overflow-hidden rounded-t-3xl bg-whisper-purple/70 px-4 pt-9 sm:px-8 lg:px-12">
      <div className="absolute inset-x-0 top-0 h-40 bg-[radial-gradient(circle_at_25%_0%,rgba(44,120,252,0.18),transparent_34%),radial-gradient(circle_at_76%_8%,rgba(214,64,159,0.16),transparent_35%)]" />

      <div className="relative mx-auto flex w-fit max-w-full items-center gap-1 overflow-x-auto rounded-full bg-canvas-white px-2 py-2 shadow-subtle">
        {["Dashboard", "Trackers", "Credits", "Telegram"].map((tab, index) => (
          <span
            key={tab}
            className={
              index === 0
                ? "shrink-0 rounded-full bg-[#00000008] px-4 py-2 text-body font-semibold leading-none text-slate-ink"
                : "shrink-0 rounded-full px-4 py-2 text-body font-medium leading-none text-muted-gray"
            }
          >
            {tab}
          </span>
        ))}
      </div>

      <div className="relative mx-auto mt-8 max-w-5xl rounded-t-3xl bg-canvas-white p-4 shadow-subtle-3 sm:p-5">
        <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
          <div className="rounded-2xl border border-light-gray bg-canvas-white p-4">
            <div className="flex flex-col gap-3 border-b border-light-gray pb-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-caption font-semibold uppercase leading-caption text-muted-gray">
                  Live trackers
                </p>
                <h3 className="mt-1 text-heading-lg font-semibold leading-heading-lg text-slate-ink">
                  28 products under watch
                </h3>
              </div>
              <div className="flex w-fit items-center gap-2 rounded-full bg-pale-mint px-3 py-2 text-caption font-semibold leading-none text-slate-ink">
                <BellRing className="size-3.5 text-radiant-violet" aria-hidden="true" />
                Telegram ready
              </div>
            </div>

            <div className="mt-4 space-y-2">
              {trackerRows.map((row) => (
                <div
                  key={row.product}
                  className="grid gap-3 rounded-2xl bg-[#00000008] px-4 py-3 sm:grid-cols-[1fr_auto_auto]"
                >
                  <div>
                    <p className="text-body font-semibold leading-body text-slate-ink">
                      {row.product}
                    </p>
                    <p className="text-caption leading-caption text-medium-gray">
                      {row.store}
                    </p>
                  </div>
                  <div className="flex gap-5 text-body leading-body sm:justify-end">
                    <span className="font-semibold text-slate-ink">{row.price}</span>
                    <span className="text-medium-gray">Target {row.target}</span>
                  </div>
                  <span
                    className={
                      row.tone === "green"
                        ? "w-fit rounded-full bg-pale-mint px-3 py-1 text-caption font-semibold leading-none text-slate-ink"
                        : row.tone === "blue"
                          ? "w-fit rounded-full bg-electric-blue/12 px-3 py-1 text-caption font-semibold leading-none text-electric-blue"
                          : "w-fit rounded-full bg-whisper-purple px-3 py-1 text-caption font-semibold leading-none text-deep-purple"
                    }
                  >
                    {row.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-4">
            <div className="rounded-2xl bg-[#00000008] p-4">
              <div className="flex items-center justify-between">
                <p className="text-caption font-semibold uppercase leading-caption text-muted-gray">
                  Credits
                </p>
                <Gauge className="size-4 text-radiant-violet" aria-hidden="true" />
              </div>
              <p className="mt-4 text-4xl font-bold leading-none text-slate-ink">7,420</p>
              <p className="mt-2 text-body leading-body text-medium-gray">
                available this cycle
              </p>
              <div className="mt-5 h-2 overflow-hidden rounded-full bg-light-gray">
                <div className="h-full w-[74%] rounded-full bg-radiant-violet" />
              </div>
            </div>

            <div className="rounded-2xl bg-slate-ink p-4 text-canvas-white">
              <div className="flex items-center gap-2">
                <Send className="size-4 text-radiant-violet" aria-hidden="true" />
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
    <section className="bg-canvas-white pb-16 font-openrunde">
      <motion.div
        initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={
          shouldReduceMotion
            ? { duration: 0 }
            : { duration: 0.58, ease: [0.22, 1, 0.36, 1] }
        }
        className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8"
      >
        <div className="flex flex-wrap items-center justify-center gap-3 text-center text-medium-gray">
          {brandList.map((brand) => (
            <div
              key={brand.label}
              className="flex items-center gap-2 rounded-full bg-[#00000008] px-4 py-2"
            >
              <CheckCircle2 className="size-4 text-radiant-violet" aria-hidden="true" />
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
