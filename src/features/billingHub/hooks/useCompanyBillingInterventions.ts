"use client";

import { useMemo } from "react";
import { useBackOfficeInterventions } from "@/features/backoffice/useBackOfficeInterventions";
import { demoBillingForCompany } from "@/features/dev/demoBillingInterventions";
import type { Intervention } from "@/features/interventions/types";

const BILLABLE_STATUSES = new Set(["done", "invoiced", "waiting_material"]);

/** Interventions société avec facturation (done / facturé). */
export function useCompanyBillingInterventions(companyId: string | null) {
  const { interventions, loading, error } = useBackOfficeInterventions(companyId);

  const liveBillable = useMemo(
    () =>
      interventions.filter(
        (iv) => BILLABLE_STATUSES.has(iv.status) || (iv.billingLines?.length ?? 0) > 0,
      ),
    [interventions],
  );

  const isPreview = liveBillable.length === 0 && Boolean(companyId);

  const items = useMemo(() => {
    if (liveBillable.length > 0) return liveBillable;
    return companyId ? demoBillingForCompany(companyId) : [];
  }, [liveBillable, companyId]);

  return {
    interventions: items,
    loading,
    error,
    isPreviewCatalog: isPreview && items.length > 0,
    hasLiveData: liveBillable.length > 0,
  };
}
