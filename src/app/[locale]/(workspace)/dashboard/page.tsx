import { TrackersDashboard } from "@/features/tracking/components/trackers-dashboard";
import { isAppLocale, localizePathname } from "@/i18n/paths";
import { getAuthContext } from "@/lib/auth-dal";
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

function buildDashboardSearchParams(
  params: Awaited<DashboardPageProps["searchParams"]>
): string {
  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (Array.isArray(value)) {
      for (const entry of value) {
        searchParams.append(key, entry);
      }
      continue;
    }

    if (value) {
      searchParams.set(key, value);
    }
  }

  const query = searchParams.toString();
  return query ? `?${query}` : "";
}

export default async function HomePage({
  params,
  searchParams,
}: DashboardPageProps) {
  const [{ locale }, pageParams] = await Promise.all([params, searchParams]);
  const currentLocale = isAppLocale(locale) ? locale : "en";
  const auth = await getAuthContext();
  if (!auth) {
    const next = `${localizePathname("/dashboard", currentLocale)}${buildDashboardSearchParams(pageParams)}`;

    redirect(
      `${localizePathname("/auth/sign-in", currentLocale)}?next=${encodeURIComponent(next)}`
    );
  }

  const checkoutPlan = parseCheckoutPlan(pageParams.billing_plan);

  if (checkoutPlan) {
    redirect(
      `${localizePathname("/billing/checkout", currentLocale)}?plan=${checkoutPlan}`
    );
  }

  const trackerParam = pageParams.tracker;
  const highlightedTrackerId = Array.isArray(trackerParam)
    ? trackerParam[0]
    : trackerParam;

  return <TrackersDashboard highlightedTrackerId={highlightedTrackerId ?? null} />;
}
