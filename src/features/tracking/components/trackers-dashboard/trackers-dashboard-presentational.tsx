"use client";

import { CreateTrackerModal } from "@/features/tracking/components/trackers-dashboard/ui/create-tracker-modal";
import { DashboardHeader } from "@/features/tracking/components/trackers-dashboard/ui/dashboard-header";
import { EditTrackerModal } from "@/features/tracking/components/trackers-dashboard/ui/edit-tracker-modal";
import { SearchFilterBar } from "@/features/tracking/components/trackers-dashboard/ui/search-filter-bar";
import { SummaryBar } from "@/features/tracking/components/trackers-dashboard/ui/summary-bar";
import { TelegramConnectionBanner } from "@/features/tracking/components/trackers-dashboard/ui/telegram-connection-banner";
import { TrackersList } from "@/features/tracking/components/trackers-dashboard/ui/trackers-list";
import { TrackersDashboardUnauthenticated } from "@/features/tracking/components/trackers-dashboard/ui/unauthenticated-card";
import type { TrackersDashboardController } from "@/features/tracking/components/trackers-dashboard/use-trackers-dashboard-controller";

export { TrackersDashboardUnauthenticated };

function formatResetDate(value: string | null): string | null {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(date);
}

export function TrackersDashboardAuthenticatedView({
  controller,
}: {
  controller: TrackersDashboardController;
}) {
  const resetDateLabel = formatResetDate(controller.creditsResetAt);

  return (
    <section className="space-y-5">
      <DashboardHeader
        canCreateTracker={controller.canCreateTracker}
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
        consumedCredits={controller.summary.consumedCredits}
        remainingCredits={controller.summary.remainingCredits}
        monthlyCredits={controller.summary.monthlyCredits}
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
        isRefreshPending={controller.isRefreshPending}
        deleteConfirmItemId={controller.deleteConfirmItemId}
        dismissRowActionError={controller.dismissRowActionError}
        exitingDeleteItemIds={controller.exitingDeleteItemIds}
        pendingActionItemIds={controller.pendingActionItemIds}
        pendingDeleteItemIds={controller.pendingDeleteItemIds}
        pauseFeedbackByItemId={controller.pauseFeedbackByItemId}
        rowActionErrorByItemId={controller.rowActionErrorByItemId}
        resumeFeedbackByItemId={controller.resumeFeedbackByItemId}
        cancelDeleteAction={controller.cancelDeleteAction}
        confirmDeleteAction={controller.confirmDeleteAction}
        openEditModal={controller.openEditModal}
        runItemAction={controller.runItemAction}
        requestDeleteAction={controller.requestDeleteAction}
      />

      <p className="text-center text-xs text-muted-foreground">
        {controller.items.length} / {controller.maxTrackers} trackers used on{" "}
        {controller.me?.entitlement.plan_key ?? "current"} plan ·{" "}
        {controller.remainingCredits.toLocaleString()} / {controller.monthlyCredits.toLocaleString()}{" "}
        credits left
        {resetDateLabel ? ` (resets ${resetDateLabel})` : ""}
      </p>

      {controller.creditsExhausted ? (
        <p className="rounded-md border border-amber-300/60 bg-amber-50 px-3 py-2 text-xs text-amber-900 dark:border-amber-800/60 dark:bg-amber-950/30 dark:text-amber-200">
          Monthly credits exhausted. Scheduled checks resume at the next reset cycle.
        </p>
      ) : null}

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

      <EditTrackerModal
        isOpen={controller.isEditModalOpen}
        item={controller.editingItem}
        trackingMode={controller.editTrackingMode}
        setTrackingMode={controller.setEditTrackingMode}
        targetAmount={controller.editTargetAmount}
        setTargetAmount={controller.setEditTargetAmount}
        interval={controller.editInterval}
        setInterval={controller.setEditInterval}
        minInterval={controller.minInterval}
        error={controller.editModalError}
        isSavePending={controller.isEditSavePending}
        onClose={controller.closeEditModal}
        onSave={controller.saveEditedTracker}
      />
    </section>
  );
}
