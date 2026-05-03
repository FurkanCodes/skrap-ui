"use client";

import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ManageBillingButton } from "@/features/billing/components/manage-billing-button";
import type { BillingPlanKey } from "@/features/billing/types";
import {
  MARKETING_PRICING_PLANS,
  type MarketingPricingPlan,
} from "@/components/shadcn-space/blocks/pricing-content";
import { cn } from "@/lib/utils";
import { ArrowUpRight, Check } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";

interface PricingProps {
  isAuthenticated: boolean;
  hasPaidSubscription: boolean;
}

const Pricing = ({ isAuthenticated, hasPaidSubscription }: PricingProps) => {
  const router = useRouter();
  const shouldReduceMotion = useReducedMotion();
  const buildCheckoutIntent = (planKey: BillingPlanKey) =>
    `/auth/sign-up?next=${encodeURIComponent(`/settings?billing_plan=${planKey}`)}`;
  const buildSettingsBillingIntent = (planKey: BillingPlanKey) =>
    `/settings?billing_plan=${planKey}`;

  const cardVariants = {
    hidden: {
      opacity: 0,
      y: shouldReduceMotion ? 0 : 80,
    },
    visible: (index: number) => ({
      opacity: 1,
      y: 0,
      transition: shouldReduceMotion
        ? { duration: 0 }
        : {
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
            {MARKETING_PRICING_PLANS.map((plan: MarketingPricingPlan, index: number) => (
              <motion.div
                key={plan.planKey}
                variants={cardVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                custom={index}
                className="w-full"
              >
                <Card
                  className={cn(
                    plan.surfaceClassName,
                    "p-8 sm:p-10 rounded-2xl ring-0 w-full h-full",
                  )}
                >
                  <CardContent className="flex flex-col gap-6 px-0 h-full w-full">
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center gap-2">
                        <Badge className="py-1 px-3 text-sm font-normal leading-5 w-fit h-7">
                          {plan.name}
                        </Badge>
                        {plan.highlight ? (
                          <Badge variant="outline" className="py-1 px-3 text-xs font-normal">
                            {plan.highlight}
                          </Badge>
                        ) : null}
                      </div>
                      <p className="text-sm font-normal text-muted-foreground max-w-56">
                        {plan.description}
                      </p>
                    </div>

                    <div className="flex flex-col gap-4 mt-auto">
                      <p className="text-4xl sm:text-5xl font-semibold text-card-foreground flex items-end">
                        ${plan.price}
                        <span className="text-base font-normal text-muted-foreground">
                          /month
                        </span>
                      </p>
                      {plan.planKey === "free" ? (
                        <Button
                          onClick={() =>
                            router.push(isAuthenticated ? "/dashboard" : "/auth/sign-up?next=/dashboard")
                          }
                          className="relative bg-card text-foreground border border-border hover:bg-card text-sm font-medium rounded-full h-12 p-1 ps-6 pe-14 group transition-all duration-500 hover:ps-14 hover:pe-6 w-fit overflow-hidden cursor-pointer"
                        >
                          <span className="relative z-10 transition-all duration-500">
                            {plan.ctaLabel}
                          </span>
                          <div className="absolute right-1 w-10 h-10 bg-foreground text-background rounded-full flex items-center justify-center transition-all duration-500 group-hover:right-[calc(100%-44px)] group-hover:rotate-45">
                            <ArrowUpRight size={16} />
                          </div>
                        </Button>
                      ) : !isAuthenticated ? (
                        <Button
                          onClick={() => router.push(buildCheckoutIntent(plan.planKey as BillingPlanKey))}
                          className="relative bg-card text-foreground border border-border hover:bg-card text-sm font-medium rounded-full h-12 p-1 ps-6 pe-14 group transition-all duration-500 hover:ps-14 hover:pe-6 w-fit overflow-hidden cursor-pointer"
                        >
                          <span className="relative z-10 transition-all duration-500">
                            {plan.ctaLabel}
                          </span>
                          <div className="absolute right-1 w-10 h-10 bg-foreground text-background rounded-full flex items-center justify-center transition-all duration-500 group-hover:right-[calc(100%-44px)] group-hover:rotate-45">
                            <ArrowUpRight size={16} />
                          </div>
                        </Button>
                      ) : hasPaidSubscription ? (
                        <ManageBillingButton label="Manage billing" />
                      ) : (
                        <Button
                          onClick={() => router.push(buildSettingsBillingIntent(plan.planKey as BillingPlanKey))}
                          className="relative bg-card text-foreground border border-border hover:bg-card text-sm font-medium rounded-full h-12 p-1 ps-6 pe-14 group transition-all duration-500 hover:ps-14 hover:pe-6 w-fit overflow-hidden cursor-pointer"
                        >
                          <span className="relative z-10 transition-all duration-500">
                            {plan.ctaLabel}
                          </span>
                          <div className="absolute right-1 w-10 h-10 bg-foreground text-background rounded-full flex items-center justify-center transition-all duration-500 group-hover:right-[calc(100%-44px)] group-hover:rotate-45">
                            <ArrowUpRight size={16} />
                          </div>
                        </Button>
                      )}
                    </div>

                    <Separator orientation="horizontal" className="block" />

                    <div className="flex flex-col items-start gap-3 grow">
                      <p className="text-card-foreground text-base sm:text-xl font-normal sm:font-medium">
                        Included
                      </p>
                      <ul className="flex flex-col items-start self-stretch gap-3">
                        {plan.features.map((feature: string) => {
                          return (
                            <li
                              key={feature}
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
