"use client";

import { useRouter } from "next/navigation";
import { IconArrowRight, IconCheck } from "@tabler/icons-react";
import { motion, useReducedMotion } from "motion/react";

import {
  MARKETING_PRICING_PLANS,
  type MarketingPricingPlan,
} from "@/components/shadcn-space/blocks/pricing-content";
import { ManageBillingButton } from "@/features/billing/components/manage-billing-button";
import type { BillingPlanKey } from "@/features/billing/types";
import { isAppLocale, localizePathname } from "@/i18n/paths";
import { cn } from "@/lib/utils";

interface PricingProps {
  isAuthenticated: boolean;
  hasPaidSubscription: boolean;
}

const Pricing = ({ isAuthenticated, hasPaidSubscription }: PricingProps) => {
  const router = useRouter();
  const locale = "en";
  const currentLocale = isAppLocale(locale) ? locale : "en";
  const shouldReduceMotion = useReducedMotion();
  const buildBillingCheckoutPath = (planKey: BillingPlanKey) =>
    `${localizePathname("/billing/checkout", currentLocale)}?plan=${planKey}`;
  const buildCheckoutIntent = (planKey: BillingPlanKey) =>
    `${localizePathname("/auth/sign-up", currentLocale)}?next=${encodeURIComponent(buildBillingCheckoutPath(planKey))}`;

  const handlePlanClick = (plan: MarketingPricingPlan) => {
    if (plan.planKey === "free") {
      router.push(isAuthenticated ? "/dashboard" : "/auth/sign-up?next=/dashboard");
      return;
    }

    if (!isAuthenticated) {
      router.push(buildCheckoutIntent(plan.planKey as BillingPlanKey));
      return;
    }

    router.push(buildBillingCheckoutPath(plan.planKey as BillingPlanKey));
  };

  return (
    <section className="bg-background py-14 font-openrunde sm:py-16">
      <div className="mx-auto max-w-5xl px-5">
        <motion.div
          initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={
            shouldReduceMotion
              ? { duration: 0 }
              : { duration: 0.58, ease: [0.22, 1, 0.36, 1] }
          }
          className="flex flex-col items-center gap-5 text-center"
        >
          <span className="rounded-sm bg-bg-a1 px-3 py-1.5 text-caption font-semibold uppercase leading-none text-fg-1">
            Pricing
          </span>
          <h2 className="max-w-xl text-4xl font-semibold leading-[1.1] text-fg-4 sm:text-[44px]">
            Pick the credit plan that matches your tracking volume
          </h2>
          <p className="max-w-xl text-lg font-medium leading-6 text-fg-3">
            Start with a few high-intent products, then scale checks and active
            trackers as your sourcing workflow grows.
          </p>
        </motion.div>

        <div className="mt-12 grid grid-cols-1 gap-4 lg:grid-cols-3">
          {MARKETING_PRICING_PLANS.map((plan, index) => {
            const isFeatured = plan.planKey === "plus";
            const showManageBilling =
              isAuthenticated && hasPaidSubscription && plan.planKey !== "free";

            return (
              <motion.article
                key={plan.planKey}
                initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 26 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={
                  shouldReduceMotion
                    ? { duration: 0 }
                    : {
                        delay: index * 0.08,
                        duration: 0.54,
                        ease: [0.22, 1, 0.36, 1],
                      }
                }
                className={cn(
                  "flex min-h-[500px] flex-col rounded-[24px] border border-transparent p-6",
                  plan.surfaceClassName,
                  isFeatured && "border-landing-ink shadow-subtle-2",
                )}
              >
                <div className="flex items-center justify-between gap-3">
                  <span
                    className={cn(
                      "rounded-full px-3 py-1.5 text-caption font-semibold uppercase leading-none",
                      isFeatured
                        ? "bg-landing-ink text-landing-yellow-strong"
                        : "bg-background text-fg-4 shadow-subtle-2",
                    )}
                  >
                    {plan.name}
                  </span>
                  {plan.highlight ? (
                    <span className="rounded-full bg-background px-3 py-1.5 text-caption font-semibold leading-none text-landing-ink shadow-subtle-2">
                      {plan.highlight}
                    </span>
                  ) : null}
                </div>

                <p className="mt-5 min-h-16 text-body font-medium leading-body text-fg-3">
                  {plan.description}
                </p>

                <div className="mt-8 flex items-end gap-1">
                  <span className="text-5xl font-semibold leading-none text-fg-4">
                    ${plan.price}
                  </span>
                  <span className="pb-1 text-body font-medium leading-body text-fg-3">
                    /month
                  </span>
                </div>

                <div className="mt-8">
                  {showManageBilling ? (
                    <ManageBillingButton label="Manage billing" />
                  ) : (
                    <button
                      type="button"
                      onClick={() => handlePlanClick(plan)}
                      className={cn(
                        "inline-flex h-12 w-full items-center justify-center gap-2 rounded-full px-5 text-body font-semibold leading-none transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-landing-ink/50 focus-visible:ring-offset-2",
                        isFeatured
                          ? "bg-landing-ink text-landing-card shadow-subtle hover:bg-landing-muted"
                          : "bg-background text-fg-4 shadow-subtle-2 hover:bg-bg-a1",
                      )}
                    >
                      {plan.ctaLabel}
                      <IconArrowRight className="size-4" aria-hidden="true" stroke={1.5} />
                    </button>
                  )}
                </div>

                <div className="mt-8 h-px bg-light-gray" />

                <div className="mt-7">
                  <p className="text-body font-semibold leading-body text-fg-4">
                    Included
                  </p>
                  <ul className="mt-4 flex flex-col gap-3">
                    {plan.features.map((feature) => (
                      <li
                        key={feature}
                        className="flex items-start gap-3 text-body font-medium leading-body text-fg-3"
                      >
                        <IconCheck
                          className="mt-0.5 size-4 shrink-0 text-landing-ink"
                          aria-hidden="true"
                          stroke={1.5}
                        />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.article>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Pricing;
