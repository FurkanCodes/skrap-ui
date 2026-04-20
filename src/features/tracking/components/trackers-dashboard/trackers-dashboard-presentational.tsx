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
  const hasActiveFilters =
    controller.query.trim().length > 0 ||
    controller.statusFilter !== "all" ||
    controller.modeFilter !== "all";

  return (
    <section className="space-y-4 md:space-y-5">
      <DashboardHeader
        canCreateTracker={controller.canCreateTracker}
        isMutating={controller.isMutating}
        isRefreshPending={controller.isRefreshPending}
        telegramConnected={controller.telegramConnected}
        onRefresh={controller.refresh}
        onOpenModal={controller.openModal}
      />

      <TelegramConnectionBanner telegramConnected={controller.telegramConnected} />

      <SummaryBar
        active={controller.summary.active}
        alerts={controller.summary.alerts}
        savedBreakdown={controller.summary.savedBreakdown}
        consumedCredits={controller.summary.consumedCredits}
        remainingCredits={controller.summary.remainingCredits}
        monthlyCredits={controller.summary.monthlyCredits}
        trackersUsed={controller.items.length}
        maxTrackers={controller.maxTrackers}
        planKey={controller.me?.entitlement.plan_key ?? "current"}
        resetDateLabel={resetDateLabel}
      />

      <SearchFilterBar
        statusFilter={controller.statusFilter}
        modeFilter={controller.modeFilter}
        query={controller.query}
        setModeFilter={controller.setModeFilter}
        setQuery={controller.setQuery}
        setStatusFilter={controller.setStatusFilter}
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
        hasAnyItems={controller.items.length > 0}
        hasActiveFilters={hasActiveFilters}
        canCreateTracker={controller.canCreateTracker}
        onClearFilters={controller.clearFilters}
        onOpenModal={controller.openModal}
      />

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
