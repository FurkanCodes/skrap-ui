"use client";
import { Marquee } from "@/components/shadcn-space/animations/marquee";
import { motion, useReducedMotion } from "motion/react";

export interface BrandList {
  label: string;
  context: string;
}

function BrandSlider({ brandList }: { brandList: BrandList[] }) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <section>
      <div className="py-6 md:py-10">
        <div className="mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 32 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={
              shouldReduceMotion
                ? { duration: 0 }
                : { duration: 1, delay: 0.6, ease: "easeInOut" }
            }
            className="flex flex-col gap-3"
          >
            <div className="flex justify-center text-center py-3 md:py-4 relative">
              <div className="flex items-center justify-center gap-4">
                <div className="hidden md:block h-0.5 w-40 bg-linear-to-l from-muted-foreground to-transparent opacity-20" />
                <p className="text-sm font-normal sm:px-2 px-10 text-muted-foreground text-center">
                  Built for fast-moving teams watching every margin point
                </p>
                <div className="hidden md:block h-0.5 w-40 bg-linear-to-r from-muted-foreground to-transparent opacity-20" />
              </div>
            </div>
            {brandList && brandList.length > 0 && (
              <div className="py-4">
                {shouldReduceMotion ? (
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 px-4">
                    {brandList.map((brand) => (
                      <div
                        key={brand.label}
                        className="rounded-xl border border-border/70 bg-card/70 px-4 py-3"
                      >
                        <p className="text-sm font-medium text-foreground">{brand.label}</p>
                        <p className="text-xs text-muted-foreground mt-1">{brand.context}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <Marquee pauseOnHover className="[--duration:26s] p-0">
                    {brandList.map((brand) => (
                      <div
                        key={brand.label}
                        className="mr-4 rounded-xl border border-border/70 bg-card/70 px-4 py-3 min-w-56"
                      >
                        <p className="text-sm font-medium text-foreground">{brand.label}</p>
                        <p className="text-xs text-muted-foreground mt-1">{brand.context}</p>
                      </div>
                    ))}
                  </Marquee>
                )}
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </section>
  );
}

export default BrandSlider;
