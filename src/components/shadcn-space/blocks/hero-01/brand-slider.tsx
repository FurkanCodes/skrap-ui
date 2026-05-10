"use client";

import {
  IconBellRinging,
  IconCircleCheck,
  IconGauge,
  IconLink,
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
    price: "$298",
    target: "$289",
    status: "Watching",
  },
  {
    product: "Dyson V15 Detect",
    store: "Target",
    price: "$549",
    target: "$499",
    status: "Ready",
  },
  {
    product: "iPad Air 11",
    store: "Apple",
    price: "$529",
    target: "$529",
    status: "Hit",
  },
] as const;

const easeOut = [0.22, 1, 0.36, 1] as const;

function BrandSlider({ brandList }: { brandList: BrandList[] }) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <section className="relative bg-background pb-12 font-openrunde sm:pb-16">
      <div className="absolute inset-x-0 top-0 h-20 bg-landing-yellow" aria-hidden="true" />

      <motion.div
        initial={{
          opacity: 0,
          y: shouldReduceMotion ? 0 : 28,
          scale: shouldReduceMotion ? 1 : 0.985,
        }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={
          shouldReduceMotion
            ? { duration: 0 }
            : { delay: 0.2, duration: 0.7, ease: easeOut }
        }
        className="relative mx-auto -mt-10 max-w-5xl px-5 sm:-mt-12"
      >
        <div className="overflow-hidden rounded-[30px] border border-border bg-landing-card shadow-subtle-3">
          <div className="grid md:grid-cols-[0.82fr_1.18fr]">
            <div className="flex min-h-[320px] flex-col justify-between bg-landing-ink p-5 text-landing-card sm:p-6 lg:p-7">
              <div>
                <div className="flex items-center gap-2">
                  <span className="flex size-9 items-center justify-center rounded-full bg-landing-yellow-strong text-landing-ink">
                    <IconLink className="size-4" aria-hidden="true" stroke={1.7} />
                  </span>
                  <span className="text-caption font-bold uppercase leading-none text-landing-card/62">
                    Live product tracker
                  </span>
                </div>

                <h2 className="mt-6 max-w-sm text-4xl font-semibold leading-[1.02] text-landing-card sm:text-[42px]">
                  One card for the price, target, and alert.
                </h2>
                <p className="mt-4 max-w-sm text-body font-medium leading-body text-landing-card/68">
                  Paste the product URL, set the number that matters, and let the
                  tracker handle the checking.
                </p>
              </div>

              <div className="mt-8 grid gap-2 sm:grid-cols-2 md:grid-cols-1 lg:grid-cols-2">
                {brandList.slice(0, 4).map((brand) => (
                  <div
                    key={brand.label}
                    className="rounded-2xl bg-landing-card/8 px-3 py-3"
                  >
                    <div className="flex items-center gap-2 text-landing-card">
                      <IconCircleCheck className="size-4 shrink-0" aria-hidden="true" stroke={1.6} />
                      <p className="text-sm font-semibold leading-none">{brand.label}</p>
                    </div>
                    <p className="mt-2 text-xs font-medium leading-4 text-landing-card/52">
                      {brand.context}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-landing-soft-gray p-4 sm:p-5 lg:p-6">
              <div className="h-full rounded-[24px] border border-border bg-landing-card p-4 sm:p-5">
                <div className="flex flex-col gap-3 border-b border-border pb-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-caption font-bold uppercase leading-caption text-landing-muted">
                      Product board
                    </p>
                    <h3 className="mt-1 text-heading-lg font-semibold leading-heading-lg text-landing-ink">
                      28 products under watch
                    </h3>
                  </div>
                  <div className="flex w-fit items-center gap-2 rounded-full bg-landing-yellow-strong px-3 py-2 text-caption font-bold leading-none text-landing-ink">
                    <IconBellRinging className="size-3.5" aria-hidden="true" stroke={1.6} />
                    Telegram ready
                  </div>
                </div>

                <div className="mt-4 space-y-2">
                  {trackerRows.map((row) => (
                    <div
                      key={row.product}
                      className="grid gap-3 rounded-[18px] bg-landing-soft-gray px-4 py-3 sm:grid-cols-[1fr_auto]"
                    >
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="truncate text-body font-semibold leading-body text-landing-ink">
                            {row.product}
                          </p>
                          <span className="rounded-full bg-landing-card px-2 py-1 text-[11px] font-bold uppercase leading-none text-landing-muted">
                            {row.status}
                          </span>
                        </div>
                        <p className="mt-1 text-caption font-semibold uppercase leading-caption text-landing-muted">
                          {row.store}
                        </p>
                      </div>

                      <div className="flex items-center gap-4 text-body leading-body sm:justify-end">
                        <span className="font-semibold text-landing-ink">{row.price}</span>
                        <span className="text-landing-muted">Target {row.target}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_0.74fr]">
                  <div className="rounded-[20px] bg-landing-ink p-4 text-landing-card">
                    <div className="flex items-center gap-2">
                      <IconBellRinging className="size-4 text-landing-yellow-strong" aria-hidden="true" stroke={1.6} />
                      <p className="text-caption font-bold uppercase leading-caption text-landing-card/58">
                        Last alert
                      </p>
                    </div>
                    <p className="mt-3 text-heading-sm font-semibold leading-heading-sm">
                      iPad Air reached target.
                    </p>
                  </div>

                  <div className="rounded-[20px] bg-landing-yellow p-4 text-landing-ink">
                    <div className="flex items-center justify-between">
                      <p className="text-caption font-bold uppercase leading-caption text-landing-muted">
                        Credits
                      </p>
                      <IconGauge className="size-4" aria-hidden="true" stroke={1.6} />
                    </div>
                    <p className="mt-4 text-3xl font-semibold leading-none">7,420</p>
                    <p className="mt-1 text-caption font-semibold leading-caption text-landing-muted">
                      left this cycle
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}

export default BrandSlider;
