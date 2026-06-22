import type { Intervention } from "@/features/interventions/types";
import {
  getTechnicianAssignmentUid,
  isTechnicianAssignmentAwaitingResponse,
} from "@/features/interventions/technicianAssignmentActions";
import { canTechnicianAmendCompletionReport } from "@/features/interventions/technicianCompletionReport";
import { canTechnicianAmendInvoicedReport } from "@/features/interventions/technicianInvoicedReportAmend";
import { capitalizeName } from "@/utils/stringUtils";
import { buildGoogleMapsDirectionsUrl } from "@/features/interventions/buildMissionContactActions";
import { interventionDescriptionText } from "@/features/interventions/interventionDescriptionText";

export function isMissionTimeTrackingActive(iv: Intervention, technicianUid: string): boolean {
  const awaitingAssignment = isTechnicianAssignmentAwaitingResponse(iv, technicianUid);
  const isInvoicedOrCancelled = iv.status === "invoiced" || iv.status === "cancelled";
  const isDoneAmendable =
    iv.status === "done" && canTechnicianAmendCompletionReport(iv, technicianUid).allowed;

  return (
    !awaitingAssignment && iv.status !== "assigned" && !isInvoicedOrCancelled && !isDoneAmendable
  );
}

export function resolveTechnicianUid(
  technicianUidProp: string | null | undefined,
  authUid: string | undefined,
  liveIv?: Intervention | null
): string {
  return (
    technicianUidProp?.trim() ||
    getTechnicianAssignmentUid(authUid) ||
    liveIv?.assignedTechnicianUid?.trim() ||
    ""
  );
}

export function buildTechnicianDetailPresentation(
  liveIv: Intervention,
  t: (key: string) => string
) {
  let firstName = liveIv.clientFirstName;
  let lastName = liveIv.clientLastName;
  if (!firstName && !lastName && liveIv.clientName) {
    const parts = liveIv.clientName.trim().split(" ");
    firstName = parts[0];
    lastName = parts.slice(1).join(" ");
  }

  const clientDisplayName =
    capitalizeName([firstName, lastName].filter(Boolean).join(" ").trim()) ||
    capitalizeName(liveIv.clientName ?? "") ||
    t("technician_hub.dashboard.detail.not_provided");

  return {
    clientDisplayName,
    descriptionText: interventionDescriptionText(liveIv),
    addressMapsHref: buildGoogleMapsDirectionsUrl(liveIv.address),
    hasAudioBlock: Boolean(liveIv.audioUrl || liveIv.transcription?.trim()),
  };
}

export function getTechnicianDetailViewFlags(liveIv: Intervention, technicianUid: string) {
  const awaitingAssignment = isTechnicianAssignmentAwaitingResponse(liveIv, technicianUid);
  const isInvoicedOrCancelled = liveIv.status === "invoiced" || liveIv.status === "cancelled";
  const isInvoicedAmendable =
    liveIv.status === "invoiced" && canTechnicianAmendInvoicedReport(liveIv, technicianUid).allowed;
  const isDoneAmendable =
    liveIv.status === "done" && canTechnicianAmendCompletionReport(liveIv, technicianUid).allowed;
  const showActionBar =
    !awaitingAssignment &&
    liveIv.status !== "assigned" &&
    !isInvoicedOrCancelled &&
    !isDoneAmendable;

  return {
    awaitingAssignment,
    isInvoicedOrCancelled,
    isInvoicedAmendable,
    isDoneAmendable,
    showActionBar,
  };
}
