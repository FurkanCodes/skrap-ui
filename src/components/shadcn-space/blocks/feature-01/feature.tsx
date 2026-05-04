"use client";

import type { LucideIcon } from "lucide-react";
import { ArrowRight } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";

type Features = {
  icon: LucideIcon;
  content: string;
}[];

const Feature = ({ featureData }: { featureData: Features }) => {
  const shouldReduceMotion = useReducedMotion();

  return (
    <section className="bg-canvas-white py-16 font-openrunde sm:py-20 lg:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ y: shouldReduceMotion ? 0 : 18, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true }}
          transition={
            shouldReduceMotion
              ? { duration: 0 }
              : { duration: 0.58, ease: [0.22, 1, 0.36, 1] }
          }
          className="flex flex-col items-center gap-5 text-center"
        >
          <span className="rounded-full bg-[#00000008] px-3 py-1.5 text-caption font-semibold uppercase leading-none text-muted-gray">
            Features
          </span>
          <h2 className="max-w-2xl text-4xl font-bold leading-[1.08] text-slate-ink sm:text-5xl">
            Everything a price-tracking workflow needs
          </h2>
          <p className="max-w-2xl text-heading-sm font-medium leading-heading-sm text-medium-gray">
            Create trackers quickly, understand credit usage, and let Telegram carry
            the alerts while your team stays focused on buying decisions.
          </p>
          <a
            href="#pricing"
            className="inline-flex h-11 items-center gap-2 rounded-full bg-radiant-violet px-5 text-body font-semibold leading-none text-canvas-white shadow-subtle transition-colors hover:bg-deep-purple focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-radiant-violet/70 focus-visible:ring-offset-2"
          >
            See pricing
            <ArrowRight className="size-4" aria-hidden="true" />
          </a>
        </motion.div>

        <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {featureData.map((value, index) => {
            const Icon = value.icon;
            const isLead = index === 0;

            return (
              <motion.div
                key={value.content}
                initial={{ y: shouldReduceMotion ? 0 : 22, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                viewport={{ once: true }}
                transition={
                  shouldReduceMotion
                    ? { duration: 0 }
                    : {
                        delay: index * 0.06,
                        duration: 0.52,
                        ease: [0.22, 1, 0.36, 1],
                      }
                }
                className={isLead ? "sm:col-span-2 lg:col-span-2" : undefined}
              >
                <article
                  className={
                    isLead
                      ? "flex min-h-52 flex-col justify-between rounded-2xl bg-slate-ink p-6 text-canvas-white"
                      : "flex min-h-52 flex-col justify-between rounded-2xl bg-[#00000008] p-6"
                  }
                >
                  <div
                    className={
                      isLead
                        ? "flex size-10 items-center justify-center rounded-full bg-canvas-white/10 text-radiant-violet"
                        : "flex size-10 items-center justify-center rounded-full bg-canvas-white text-radiant-violet shadow-subtle-2"
                    }
                  >
                    <Icon className="size-5" strokeWidth={1.7} aria-hidden="true" />
                  </div>
                  <p
                    className={
                      isLead
                        ? "max-w-xl text-heading-lg font-semibold leading-heading-lg"
                        : "text-heading-sm font-semibold leading-heading-sm text-slate-ink"
                    }
                  >
                    {value.content}
                  </p>
                </article>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Feature;
