import { TrackersDashboard } from "@/features/tracking/components/trackers-dashboard";

interface DashboardPageProps {
  searchParams: Promise<{
    tracker?: string | string[];
  }>;
}

export default async function HomePage({ searchParams }: DashboardPageProps) {
  const params = await searchParams;
  const trackerParam = params.tracker;
  const highlightedTrackerId = Array.isArray(trackerParam)
    ? trackerParam[0]
    : trackerParam;

  return (
    <div className="mx-auto w-full max-w-6xl p-6 lg:p-8">
      <TrackersDashboard highlightedTrackerId={highlightedTrackerId ?? null} />
    </div>
  );
}
