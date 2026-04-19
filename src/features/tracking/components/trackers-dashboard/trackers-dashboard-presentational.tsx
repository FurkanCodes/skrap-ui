"use client";

import { CreateTrackerModal } from "@/features/tracking/components/trackers-dashboard/ui/create-tracker-modal";
import { DashboardHeader } from "@/features/tracking/components/trackers-dashboard/ui/dashboard-header";
import { SearchFilterBar } from "@/features/tracking/components/trackers-dashboard/ui/search-filter-bar";
import { SummaryBar } from "@/features/tracking/components/trackers-dashboard/ui/summary-bar";
import { TelegramConnectionBanner } from "@/features/tracking/components/trackers-dashboard/ui/telegram-connection-banner";
import { TrackersList } from "@/features/tracking/components/trackers-dashboard/ui/trackers-list";
import { TrackersDashboardUnauthenticated } from "@/features/tracking/components/trackers-dashboard/ui/unauthenticated-card";
import type { TrackersDashboardController } from "@/features/tracking/components/trackers-dashboard/use-trackers-dashboard-controller";

export { TrackersDashboardUnauthenticated };

export function TrackersDashboardAuthenticatedView({
  controller,
}: {
  controller: TrackersDashboardController;
}) {
  return (
    <section className="space-y-5">
      <DashboardHeader
        isMutating={controller.isMutating}
        isRefreshPending={controller.isRefreshPending}
        onRefresh={controller.refresh}
        onOpenModal={controller.openModal}
      />

      <TelegramConnectionBanner
        telegramConnected={controller.telegramConnected}
        botUsername={controller.botUsername}
      />

      <SummaryBar
        active={controller.summary.active}
        alerts={controller.summary.alerts}
        saved={controller.summary.saved}
      />

      <SearchFilterBar
        filter={controller.filter}
        query={controller.query}
        setFilter={controller.setFilter}
        setQuery={controller.setQuery}
      />

      {controller.displayError ? (
        <p className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
          {controller.displayError}
        </p>
      ) : null}

      <TrackersList
        filteredItems={controller.filteredItems}
        isActionPending={controller.isActionPending}
        isMutating={controller.isMutating}
        busyItemId={controller.busyItemId}
        pauseFeedbackByItemId={controller.pauseFeedbackByItemId}
        resumeFeedbackByItemId={controller.resumeFeedbackByItemId}
        runItemAction={controller.runItemAction}
      />

      <p className="text-center text-xs text-muted-foreground">
        {controller.items.length} / {controller.maxTrackers} trackers used on{" "}
        {controller.me?.entitlement.plan_key ?? "current"} plan
      </p>

      <CreateTrackerModal
        isModalOpen={controller.isModalOpen}
        modalStep={controller.modalStep}
        setModalStep={controller.setModalStep}
        closeModal={controller.closeModal}
        isPreviewPending={controller.isPreviewPending}
        isSavePending={controller.isSavePending}
        urlInput={controller.urlInput}
        setUrlInput={controller.setUrlInput}
        fetchProductPreview={controller.fetchProductPreview}
        preview={controller.preview}
        trackingMode={controller.trackingMode}
        setTrackingMode={controller.setTrackingMode}
        targetAmount={controller.targetAmount}
        setTargetAmount={controller.setTargetAmount}
        interval={controller.interval}
        setInterval={controller.setInterval}
        minInterval={controller.minInterval}
        telegramConnected={controller.telegramConnected}
        modalError={controller.modalError}
        saveTracker={controller.saveTracker}
      />
    </section>
  );
}
