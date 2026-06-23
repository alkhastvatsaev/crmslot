"use client";

import { useMemo } from "react";
import { auth } from "@/core/config/firebase";
import { useCompanyWorkspaceOptional } from "@/context/CompanyWorkspaceContext";
import { useBackofficeInboxIntentOptional } from "@/context/BackofficeInboxIntentContext";
import { isCompanyDispatchViewer } from "@/features/company/isCompanyDispatchViewer";
import { useBackOfficeInterventions } from "@/features/backoffice/useBackOfficeInterventions";
import type { Intervention } from "@/features/interventions";

export function useBackOfficeHubSelectedIntervention(): {
  intervention: Intervention | null;
  interventionId: string | null;
  isExample: boolean;
  technicianUid: string;
  allowMaterialCreate: boolean;
  companyId: string | null;
} {
  const inboxIntent = useBackofficeInboxIntentOptional();
  const workspace = useCompanyWorkspaceOptional();
  const isDispatch = isCompanyDispatchViewer(workspace);
  const companyId = isDispatch ? (workspace?.activeCompanyId ?? null) : null;
  const { interventions } = useBackOfficeInterventions(companyId);

  const interventionId = inboxIntent?.selectedInboxInterventionId?.trim() || null;

  const liveIntervention = useMemo(
    () => (interventionId ? (interventions.find((x) => x.id === interventionId) ?? null) : null),
    [interventionId, interventions]
  );

  const intervention = liveIntervention;
  const technicianUid =
    intervention?.assignedTechnicianUid?.trim() || auth?.currentUser?.uid?.trim() || "";

  return {
    intervention,
    interventionId: intervention?.id ?? null,
    isExample: false,
    technicianUid,
    allowMaterialCreate: Boolean(intervention?.assignedTechnicianUid?.trim()),
    companyId: intervention?.companyId ?? companyId,
  };
}
