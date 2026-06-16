"use client";

import { useMemo } from "react";
import { useBackOfficeInterventions } from "@/features/backoffice/useBackOfficeInterventions";
import type { Intervention } from "@/features/interventions/types";

const BILLABLE_STATUSES = new Set(["done", "invoiced", "waiting_material"]);

/** Interventions société avec facturation (done / facturé). */
export function useCompanyBillingInterventions(companyId: string | null) {
  const { interventions, loading, error } = useBackOfficeInterventions(companyId);

  const items = useMemo(
    () =>
      interventions.filter(
        (iv) => BILLABLE_STATUSES.has(iv.status) || (iv.billingLines?.length ?? 0) > 0
      ),
    [interventions]
  );

  return {
    interventions: items,
    loading,
    error,
    isPreviewCatalog: false,
    hasLiveData: items.length > 0,
  };
}
