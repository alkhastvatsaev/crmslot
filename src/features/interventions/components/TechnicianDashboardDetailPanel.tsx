"use client";

import TechnicianDashboardDetailActive from "@/features/interventions/components/TechnicianDashboardDetailActive";
import TechnicianDashboardDetailCompleted from "@/features/interventions/components/TechnicianDashboardDetailCompleted";
import TechnicianDashboardDetailDoneAmendable from "@/features/interventions/components/TechnicianDashboardDetailDoneAmendable";
import { useTechnicianDashboardDetailController } from "@/features/interventions/hooks/useTechnicianDashboardDetailController";
import type { Intervention } from "@/features/interventions/types";

export default function TechnicianDashboardDetailPanel({
  caseId,
  liveIntervention,
  technicianUid: technicianUidProp,
  onAssignmentAccepted,
  onAssignmentDeclined,
}: {
  caseId: string | null;
  /** Snapshot partagé depuis `TechnicianHubPage` (évite 2 listeners Firestore sur le même doc). */
  liveIntervention?: Intervention | null;
  /** Même UID que la liste (`useTechnicianAssignments().firebaseUid`). */
  technicianUid?: string | null;
  onAssignmentAccepted?: (next: Intervention) => void;
  onAssignmentDeclined?: () => void;
}) {
  const c = useTechnicianDashboardDetailController({
    caseId,
    liveIntervention,
    technicianUid: technicianUidProp,
    onAssignmentAccepted,
    onAssignmentDeclined,
  });

  if (!caseId) {
    return (
      <div data-testid="technician-dashboard-detail-empty" className="min-h-0 flex-1" aria-hidden />
    );
  }

  if (!c.liveIv || !c.viewFlags || !c.presentation) {
    return (
      <div
        data-testid="technician-dashboard-detail-loading"
        className="flex min-h-0 flex-1 flex-col gap-2 p-3"
      >
        <div className="h-8 w-2/3 animate-pulse rounded-md bg-slate-200/60" />
        <div className="flex min-h-0 flex-1 flex-col gap-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-12 w-full animate-pulse rounded-xl bg-slate-200/60" />
          ))}
        </div>
      </div>
    );
  }

  const { liveIv, viewFlags, presentation } = c;

  return (
    <div
      data-testid="technician-dashboard-detail"
      className="flex min-h-0 flex-1 flex-col overflow-hidden"
    >
      {viewFlags.isInvoicedOrCancelled ? (
        <TechnicianDashboardDetailCompleted
          isInvoicedAmendable={viewFlags.isInvoicedAmendable}
          onStartFinishJob={c.onStartFinishJob}
        />
      ) : viewFlags.isDoneAmendable ? (
        <TechnicianDashboardDetailDoneAmendable
          caseId={caseId}
          liveIv={liveIv}
          technicianUid={c.technicianUid}
          queryClient={c.queryClient}
          clientDisplayName={presentation.clientDisplayName}
          descriptionText={presentation.descriptionText}
          addressMapsHref={presentation.addressMapsHref}
          primaryContactActions={c.primaryContactActions}
          onStartFinishJob={c.onStartFinishJob}
        />
      ) : (
        <TechnicianDashboardDetailActive
          liveIv={liveIv}
          caseId={caseId}
          technicianUid={c.technicianUid}
          clientDisplayName={presentation.clientDisplayName}
          descriptionText={presentation.descriptionText}
          addressMapsHref={presentation.addressMapsHref}
          hasAudioBlock={presentation.hasAudioBlock}
          awaitingAssignment={viewFlags.awaitingAssignment}
          showActionBar={viewFlags.showActionBar}
          showEarlyStartPrompt={c.showEarlyStartPrompt}
          isUpdating={c.isUpdating}
          primaryContactActions={c.primaryContactActions}
          onAssignmentAccepted={onAssignmentAccepted}
          onAssignmentDeclined={onAssignmentDeclined}
          onEarlyStartConfirm={() => void c.handleEarlyStartConfirm()}
          onEarlyStartDismiss={() => c.setEarlyStartDismissed(true)}
          onUpdateStatus={c.handleUpdateStatus}
          onStartFinishJob={c.onStartFinishJob}
        />
      )}
    </div>
  );
}
