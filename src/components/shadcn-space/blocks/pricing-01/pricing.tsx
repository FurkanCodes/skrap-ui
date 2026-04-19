"use client";

import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { ArrowUpRight, Check } from "lucide-react";
import { motion } from "motion/react";

type PricingPlan = {
  plan_bg_color: string;
  plan_name: string;
  plan_descp: string;
  plan_price: number;
  plan_feature: string[];
  highlight?: string;
};

const pricingData: PricingPlan[] = [
  {
    plan_bg_color: "bg-blue-500/10",
    plan_name: "Starter",
    plan_descp: "For solo operators validating their first deal workflows.",
    plan_price: 0,
    plan_feature: [
      "1,500 credits / month",
      "Up to 10 active trackers",
      "Minimum 60-minute check interval",
      "Price monitor mode",
      "Email + in-app notifications",
    ],
  },
  {
    plan_bg_color: "bg-teal-400/20",
    plan_name: "Growth",
    plan_descp: "For teams that need faster checks and Telegram-first alerts.",
    plan_price: 29,
    highlight: "Most popular",
    plan_feature: [
      "12,000 credits / month",
      "Up to 150 active trackers",
      "Minimum 15-minute check interval",
      "Telegram alerts + daily summaries",
      "Priority retry queue",
    ],
  },
  {
    plan_bg_color: "bg-violet-400/15",
    plan_name: "Scale",
    plan_descp: "For high-volume sourcing teams running aggressive monitoring.",
    plan_price: 99,
    plan_feature: [
      "50,000 credits / month",
      "Up to 1,000 active trackers",
      "Minimum 5-minute check interval",
      "Multi-channel alerts (Telegram + webhooks)",
      "Higher throughput and support SLA",
    ],
  },
];

const Pricing = () => {
  const router = useRouter();

  const cardVariants = {
    hidden: {
      opacity: 0,
      y: 80,
    },
    visible: (index: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: index * 0.2,
        duration: 0.6,
        ease: [0.22, 1, 0.36, 1] as const,
      },
    }),
  };

  return (
    <section className="bg-background py-10 xl:py-0">
      <div className="max-w-7xl mx-auto px-4 lg:px-8 xl:px-16 lg:py-20 sm:py-16 py-8">
        <div className="flex flex-col gap-8 md:gap-12 justify-center items-center w-full">
          <div className="flex flex-col gap-4 justify-center items-center animate-in fade-in slide-in-from-top-8 duration-700 ease-in-out">
            <Badge
              variant={"outline"}
              className="py-1 px-3 text-sm font-normal leading-5 w-fit h-7"
            >
              Credits + Tiers
            </Badge>
            <div className="max-w-3xs sm:max-w-md mx-auto text-center">
              <h2 className="text-foreground text-3xl sm:text-5xl font-medium">
                Pick the credit plan that matches your tracking volume
              </h2>
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 items-stretch justify-center gap-6 w-full">
            {pricingData?.map((items: PricingPlan, index: number) => (
              <motion.div
                key={index}
                variants={cardVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                custom={index}
                className="w-full"
              >
                <Card
                  className={cn(
                    items.plan_bg_color,
                    "p-8 sm:p-10 rounded-2xl ring-0 w-full h-full",
                  )}
                  key={index}
                >
                  <CardContent className="flex flex-col gap-6 px-0 h-full w-full">
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center gap-2">
                        <Badge className="py-1 px-3 text-sm font-normal leading-5 w-fit h-7">
                          {items.plan_name}
                        </Badge>
                        {items.highlight ? (
                          <Badge variant="outline" className="py-1 px-3 text-xs font-normal">
                            {items.highlight}
                          </Badge>
                        ) : null}
                      </div>
                      <p className="text-sm font-normal text-muted-foreground max-w-56">
                        {items.plan_descp}
                      </p>
                    </div>

                    <div className="flex flex-col gap-4 mt-auto">
                      <p className="text-4xl sm:text-5xl font-semibold text-card-foreground flex items-end">
                        ${items.plan_price}
                        <span className="text-base font-normal text-muted-foreground">
                          /month
                        </span>
                      </p>
                      <Button
                        onClick={() => router.push("/auth/sign-up?next=/dashboard")}
                        className="relative bg-white hover:bg-white hover:text-black dark:hover:text-black text-black text-sm font-medium rounded-full h-12 p-1 ps-6 pe-14 group transition-all duration-500 hover:ps-14 hover:pe-6 w-fit overflow-hidden cursor-pointer"
                      >
                        <span className="relative z-10 transition-all duration-500">
                          Start with {items.plan_name}
                        </span>
                        <div className="absolute right-1 w-10 h-10 bg-black text-white rounded-full flex items-center justify-center transition-all duration-500 group-hover:right-[calc(100%-44px)] group-hover:rotate-45">
                          <ArrowUpRight size={16} />
                        </div>
                      </Button>
                    </div>

                    <Separator orientation="horizontal" className="block" />

                    <div className="flex flex-col items-start gap-3 grow">
                      <p className="text-card-foreground text-base sm:text-xl font-normal sm:font-medium">
                        Included
                      </p>
                      <ul className="flex flex-col items-start self-stretch gap-3">
                        {items.plan_feature?.map((feature: string, index: number) => {
                          return (
                            <li
                              key={index}
                              className="flex items-center gap-3 text-card-foreground text-base font-normal tracking-normal"
                            >
                              <Check size={16} aria-hidden="true" />
                              {feature}
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Pricing;
