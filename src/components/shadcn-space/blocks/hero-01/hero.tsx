"use client";

import { useRouter } from "next/navigation";
import { IconArrowRight, IconChevronRight } from "@tabler/icons-react";
import { motion, useReducedMotion } from "motion/react";

function HeroSection({
  isAuthenticated,
}: {
  isAuthenticated: boolean;
}) {
  const router = useRouter();
  const shouldReduceMotion = useReducedMotion();
  const ctaLabel = isAuthenticated ? "Go to Dashboard" : "Start free";
  const ctaPath = isAuthenticated ? "/dashboard" : "/auth/sign-up?next=/dashboard";

  const revealTransition = shouldReduceMotion
    ? { duration: 0 }
    : { duration: 0.62, ease: [0.22, 1, 0.36, 1] as const };

  return (
    <section className="relative overflow-hidden bg-landing-yellow font-openrunde">
      <div className="mx-auto flex w-full max-w-3xl flex-col items-center gap-4 px-5 pb-14 pt-34 text-center sm:pb-16 sm:pt-38">
        <motion.a
          href="#pricing"
          initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={revealTransition}
          className="inline-flex items-center gap-2 rounded-full bg-landing-card py-1.5 pl-1.5 pr-2.5 text-sm font-semibold text-landing-ink transition-colors hover:bg-landing-paper focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-landing-ink/50"
        >
          <span className="flex h-5 items-center justify-center rounded-full bg-landing-ink px-1.5 text-xs font-semibold uppercase text-landing-yellow-strong">
            NEW
          </span>
          Price alerts in Telegram
          <IconChevronRight className="size-4" aria-hidden="true" stroke={1.5} />
        </motion.a>

        <motion.h1
          initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={
            shouldReduceMotion
              ? { duration: 0 }
              : { ...revealTransition, delay: 0.08 }
          }
          className="max-w-md text-6xl/17 font-semibold text-fg-4 md:text-balance"
        >
          Track prices before margins disappear
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={
            shouldReduceMotion
              ? { duration: 0 }
              : { ...revealTransition, delay: 0.16 }
          }
          className="w-full max-w-md text-lg/6 font-medium text-fg-3"
        >
          Turn product URLs into live trackers, spend credits with control, and
          get Telegram alerts the moment a target price hits.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={
            shouldReduceMotion
              ? { duration: 0 }
              : { ...revealTransition, delay: 0.24 }
          }
          className="flex flex-col items-center gap-4 md:flex-row"
        >
          <button
            type="button"
            onClick={() => router.push(ctaPath)}
          className="inline-flex h-11 w-[320px] items-center justify-center rounded-full bg-landing-ink px-5 text-body font-semibold leading-none text-landing-card shadow-subtle transition-all hover:bg-landing-muted active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-landing-ink/50 focus-visible:ring-offset-2 md:w-auto"
          >
            {ctaLabel}
          </button>
          <a
            href="#features"
            className="inline-flex h-11 w-[320px] items-center justify-center gap-2 rounded-full bg-landing-card px-5 text-body font-semibold leading-none text-landing-ink transition-all hover:bg-landing-paper active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-landing-ink/50 focus-visible:ring-offset-2 md:w-auto"
          >
            See how it works
            <IconArrowRight className="size-4" aria-hidden="true" stroke={1.5} />
          </a>
        </motion.div>
      </div>
    </section>
  );
}

export default HeroSection;
