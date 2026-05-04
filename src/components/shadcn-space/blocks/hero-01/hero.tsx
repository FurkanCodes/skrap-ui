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
    <section className="relative overflow-hidden bg-canvas-white font-openrunde">
      <div className="mx-auto flex min-h-[560px] max-w-6xl flex-col items-center justify-start px-4 pb-20 pt-14 text-center sm:min-h-[620px] sm:justify-center sm:px-6 sm:pt-20 lg:px-8">
        <motion.a
          href="#pricing"
          initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={revealTransition}
          className="mb-9 inline-flex h-10 items-center gap-2 rounded-full bg-whisper-purple/45 px-2.5 text-body font-medium leading-body text-electric-blue transition-colors hover:bg-whisper-purple focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-radiant-violet/60"
        >
          <span className="rounded-full bg-radiant-violet px-2 py-1 text-caption font-semibold leading-none text-canvas-white">
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
          className="max-w-4xl text-5xl font-bold leading-[1.04] text-slate-ink sm:text-6xl lg:text-7xl"
        >
          Price tracking for teams that move before margins disappear
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={
            shouldReduceMotion
              ? { duration: 0 }
              : { ...revealTransition, delay: 0.16 }
          }
          className="mt-7 max-w-2xl text-heading-sm font-medium leading-heading-sm text-medium-gray sm:text-heading"
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
          className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row"
        >
          <button
            type="button"
            onClick={() => router.push(ctaPath)}
            className="inline-flex h-[52px] min-w-44 items-center justify-center rounded-full bg-radiant-violet px-7 text-heading-sm font-semibold leading-none text-canvas-white shadow-subtle transition-colors hover:bg-deep-purple focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-radiant-violet/70 focus-visible:ring-offset-2"
          >
            {ctaLabel}
          </button>
          <a
            href="#features"
            className="inline-flex h-[52px] min-w-36 items-center justify-center gap-2 rounded-full bg-[#00000008] px-6 text-heading-sm font-semibold leading-none text-medium-gray transition-colors hover:bg-light-gray/70 hover:text-slate-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-radiant-violet/60 focus-visible:ring-offset-2"
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
