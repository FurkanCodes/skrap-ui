import { TrackersDashboard } from "@/features/tracking/components/trackers-dashboard";
import { isAppLocale, localizePathname } from "@/i18n/paths";
import { redirect } from "next/navigation";

interface DashboardPageProps {
  params: Promise<{
    locale: string;
  }>;
  searchParams: Promise<{
    tracker?: string | string[];
    billing_plan?: string | string[];
  }>;
}

function parseCheckoutPlan(value: string | string[] | undefined): "plus" | "pro" | null {
  const plan = Array.isArray(value) ? value[0] : value;
  return plan === "plus" || plan === "pro" ? plan : null;
}

export default async function HomePage({
  params,
  searchParams,
}: DashboardPageProps) {
  const [{ locale }, pageParams] = await Promise.all([params, searchParams]);
  const checkoutPlan = parseCheckoutPlan(pageParams.billing_plan);

  if (checkoutPlan) {
    const currentLocale = isAppLocale(locale) ? locale : "en";
    redirect(
      `${localizePathname("/billing/return", currentLocale)}?plan=${checkoutPlan}&start=1`
    );
  }

  const trackerParam = pageParams.tracker;
  const highlightedTrackerId = Array.isArray(trackerParam)
    ? trackerParam[0]
    : trackerParam;

  return (
    <div className="mx-auto w-full max-w-6xl p-6 lg:p-8">
      <TrackersDashboard highlightedTrackerId={highlightedTrackerId ?? null} />
    </div>
  );
}
