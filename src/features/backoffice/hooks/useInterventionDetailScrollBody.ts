"use client";

import { useTechnicians } from "@/features/technicians/hooks";
import { hasPendingTechnicianReportAmendment } from "@/features/interventions/technicianInvoicedReportAmend";
import { isInterventionInBackofficeRequestsQueue } from "@/features/interventions/technicianSchedule";
import type { Intervention } from "@/features/interventions/types";

export function useInterventionDetailScrollBody(selectedItem: Intervention) {
  const { technicians } = useTechnicians();
  const isInRequestsQueue = isInterventionInBackofficeRequestsQueue(selectedItem);
  const amendedByUid = (selectedItem.technicianReportAmendedByUid ?? "").trim();
  const amendedByTech = technicians.find(
    (tech) => tech.id === amendedByUid || tech.authUid === amendedByUid
  );
  const amendedByName =
    [amendedByTech?.firstName, amendedByTech?.lastName].filter(Boolean).join(" ").trim() ||
    amendedByTech?.name?.trim() ||
    amendedByUid;
  const showTechnicianAmendmentAlert =
    hasPendingTechnicianReportAmendment(selectedItem) && !isInRequestsQueue;

  return {
    isInRequestsQueue,
    amendedByName,
    showTechnicianAmendmentAlert,
  };
}
