import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { LucideIcon, Quote } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";

type Features = {
  icon: LucideIcon;
  content: string;
}[];

const Feature = ({ featureData }: { featureData: Features }) => {
  const shouldReduceMotion = useReducedMotion();

  return (
    <section>
      <div className="lg:py-20 sm:py-16 py-8 ">
        <div className="mx-auto max-w-7xl px-4 sm:px-8">
          <div className="flex flex-col gap-8 md:gap-12">
            <motion.div
              initial={{ y: shouldReduceMotion ? 0 : -20, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={
                shouldReduceMotion
                  ? { duration: 0 }
                  : {
                      duration: 0.8,
                      ease: [0.21, 0.47, 0.32, 0.98],
                    }
              }
              className="flex flex-col md:flex-row items-center md:items-end justify-center md:justify-between gap-4"
            >
              <div className="flex flex-col gap-4 max-w-full items-center md:items-start text-center md:text-left md:max-w-xl">
                <Badge
                  variant={"outline"}
                  className="px-3 py-1 h-auto text-sm font-normal"
                >
                  Why Dealvinci
                </Badge>
                <h2 className="text-3xl md:text-4xl font-semibold">
                  Built for operators who move on margin
                </h2>
                <p className="text-lg font-normal text-muted-foreground">
                  Dealvinci combines credit-based monitoring, target price alerts,
                  and fast tracker setup so your team acts first when prices move.
                </p>
              </div>
              <a href="#pricing">
                <Button className="rounded-full px-5 py-2.5 shadow-xs h-auto cursor-pointer">
                  See pricing
                </Button>
              </a>
            </motion.div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-6">
              <motion.div
                initial={{ x: shouldReduceMotion ? 0 : -100, opacity: 0 }}
                whileInView={{ x: 0, opacity: 1 }}
                viewport={{ once: true }}
                transition={
                  shouldReduceMotion
                    ? { duration: 0 }
                    : {
                        duration: 0.8,
                        ease: [0.21, 0.47, 0.32, 0.98],
                      }
                }
                className="p-6 sm:p-10 rounded-2xl bg-gradient-to-br from-accent/65 via-card to-secondary/70 h-full w-full"
              >
                <Card className="border-none shadow-none ring-0 rounded-xl bg-card/75">
                  <CardContent className="flex flex-col gap-4 px-6 sm:px-8 pt-8">
                    <Quote className="size-6 text-muted-foreground" aria-hidden="true" />
                    <h3 className="text-xl sm:text-2xl font-medium">
                      &ldquo;We moved from manual checks to one dashboard and got
                      notified in time to act on the deals that actually mattered.&rdquo;
                    </h3>
                  </CardContent>
                  <CardFooter className="w-full px-6 sm:px-8 pb-8 pt-1 flex flex-col items-start gap-0.5">
                    <p className="text-sm font-medium text-primary">Beta feedback snapshot</p>
                    <span className="text-xs font-normal text-muted-foreground uppercase tracking-wide">
                      Sourcing operator workflow
                    </span>
                  </CardFooter>
                </Card>
              </motion.div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-6">
                {featureData?.map((value, index) => {
                  return (
                    <motion.div
                      key={index}
                      initial={{ x: shouldReduceMotion ? 0 : 100, opacity: 0 }}
                      whileInView={{ x: 0, opacity: 1 }}
                      viewport={{ once: true }}
                      transition={
                        shouldReduceMotion
                          ? { duration: 0 }
                          : {
                              duration: 0.8,
                              ease: [0.21, 0.47, 0.32, 0.98],
                            }
                      }
                    >
                      <Card className="py-8 bg-muted ring-0 border-0 h-full">
                        <CardContent className="w-full h-full px-8 flex flex-col items-start gap-12 justify-between">
                          <value.icon
                            className="w-6 h-6 text-muted-foreground"
                            strokeWidth={1.5}
                          />
                          <p className="text-base text-foreground font-normal">
                            {value?.content}
                          </p>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Feature;
