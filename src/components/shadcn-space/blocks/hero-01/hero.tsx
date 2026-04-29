"use client";

import { Instrument_Serif } from "next/font/google";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { motion, useReducedMotion } from "motion/react";
import { ArrowUpRight } from "lucide-react";

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: ["400"],
  style: ["italic"],
});

function HeroSection() {
  const router = useRouter();
  const shouldReduceMotion = useReducedMotion();

  return (
    <section>
      <div className="w-full h-full relative">
        <div className="relative w-full pt-0 md:pt-20 pb-6 md:pb-10 before:absolute before:w-full before:h-full before:bg-linear-to-r before:from-accent/50 before:via-background before:to-muted/50 before:rounded-full before:top-24 before:blur-3xl before:-z-10">
          <div className="container mx-auto relative z-10">
            <div className="grid max-w-6xl mx-auto gap-8 lg:gap-12 lg:grid-cols-[1.05fr_0.95fr] items-center">
              <div className="flex flex-col gap-8">
                <div className="relative flex flex-col text-center lg:text-left items-center lg:items-start sm:gap-6 gap-4">
                  <motion.h1
                    initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 32 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={
                      shouldReduceMotion
                        ? { duration: 0 }
                        : { duration: 1, ease: "easeInOut" }
                    }
                    className="lg:text-7xl md:text-6xl text-5xl font-medium leading-14 md:leading-18 lg:leading-20"
                  >
                    Never miss a price drop with{" "}
                    <span className={`${instrumentSerif.className} tracking-tight`}>
                      credit-powered tracking
                    </span>
                  </motion.h1>
                  <motion.p
                    initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 32 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={
                      shouldReduceMotion
                        ? { duration: 0 }
                        : { duration: 1, delay: 0.1, ease: "easeInOut" }
                    }
                    className="text-base font-normal max-w-2xl text-muted-foreground"
                  >
                    Dealvinci helps operators turn product URLs into live trackers,
                    run checks with credits, and deliver alerts straight to Telegram
                    the moment prices move.
                  </motion.p>
                </div>

                <motion.div
                  initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 32 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={
                    shouldReduceMotion
                      ? { duration: 0 }
                      : { duration: 1, delay: 0.2, ease: "easeInOut" }
                  }
                  className="flex items-center justify-center lg:justify-start"
                >
                  <Button
                    onClick={() => router.push("/auth/sign-up?next=/dashboard")}
                    className="relative text-sm font-medium rounded-full h-12 p-1 ps-6 pe-14 group transition-all duration-500 hover:ps-14 hover:pe-6 w-fit overflow-hidden cursor-pointer"
                  >
                    <span className="relative z-10 transition-all duration-500">
                      Start free
                    </span>
                    <span className="absolute right-1 w-10 h-10 bg-background text-foreground rounded-full flex items-center justify-center transition-all duration-500 group-hover:right-[calc(100%-44px)] group-hover:rotate-45">
                      <ArrowUpRight size={16} />
                    </span>
                  </Button>
                </motion.div>
              </div>

              <motion.div
                initial={{ opacity: 0, x: shouldReduceMotion ? 0 : 24 }}
                animate={{ opacity: 1, x: 0 }}
                transition={
                  shouldReduceMotion
                    ? { duration: 0 }
                    : { duration: 1, delay: 0.15, ease: "easeInOut" }
                }
                className="w-full"
              >
                <div className="relative mx-auto max-w-xl">
                  <motion.div
                    animate={
                      shouldReduceMotion
                        ? undefined
                        : {
                            y: [0, -8, 0],
                            rotate: [0, 0.6, 0],
                            scale: [1, 1.01, 1],
                          }
                    }
                    transition={
                      shouldReduceMotion
                        ? undefined
                        : {
                            duration: 6,
                            repeat: Number.POSITIVE_INFINITY,
                            ease: "easeInOut",
                          }
                    }
                    className="will-change-transform"
                  >
                    <Image
                      src="/illustrations/money-income.svg"
                      alt="Money income illustration"
                      width={750}
                      height={500}
                      priority
                      className="h-auto w-full"
                    />
                  </motion.div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default HeroSection;
