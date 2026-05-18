"use client";

import { useMemo } from "react";
import { auth } from "@/core/config/firebase";
import { useCompanyWorkspaceOptional } from "@/context/CompanyWorkspaceContext";
import { useBackofficeInboxIntentOptional } from "@/context/BackofficeInboxIntentContext";
import { isCompanyDispatchViewer } from "@/features/company/isCompanyDispatchViewer";
import {
  BACK_OFFICE_HUB_EXAMPLE_INTERVENTION,
  BACK_OFFICE_HUB_EXAMPLE_INTERVENTION_ID,
} from "@/features/backoffice/backOfficeHubExample";
import { useBackOfficeInterventions } from "@/features/backoffice/useBackOfficeInterventions";
import type { Intervention } from "@/features/interventions/types";

export function useBackOfficeHubSelectedIntervention(): {
  intervention: Intervention;
  interventionId: string;
  isExample: boolean;
  technicianUid: string;
  allowMaterialCreate: boolean;
  companyId: string | null;
} {
  const inboxIntent = useBackofficeInboxIntentOptional();
  const workspace = useCompanyWorkspaceOptional();
  const isDispatch = isCompanyDispatchViewer(workspace);
  const companyId = isDispatch ? workspace?.activeCompanyId ?? null : null;
  const { interventions } = useBackOfficeInterventions(companyId);

  const interventionId = inboxIntent?.selectedInboxInterventionId?.trim() || null;

  const liveIntervention = useMemo(
    () => (interventionId ? interventions.find((x) => x.id === interventionId) ?? null : null),
    [interventionId, interventions],
  );

  const isExample = !liveIntervention;
  const intervention = liveIntervention ?? BACK_OFFICE_HUB_EXAMPLE_INTERVENTION;
  const effectiveId = liveIntervention?.id ?? BACK_OFFICE_HUB_EXAMPLE_INTERVENTION_ID;

  const technicianUid =
    intervention.assignedTechnicianUid?.trim() || auth?.currentUser?.uid?.trim() || "";

  return {
    intervention,
    interventionId: effectiveId,
    isExample,
    technicianUid,
    allowMaterialCreate: Boolean(intervention.assignedTechnicianUid?.trim()),
    companyId: intervention.companyId ?? companyId,
  };
}
