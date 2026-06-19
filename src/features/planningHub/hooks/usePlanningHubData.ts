"use client";

import { useBackOfficeInterventions } from "@/features/backoffice/useBackOfficeInterventions";
import { useTechnicians } from "@/features/technicians/hooks";

export function usePlanningHubData(companyId: string | null) {
  const { interventions, loading: interventionsLoading } = useBackOfficeInterventions(companyId);
  const { technicians, loading: techniciansLoading } = useTechnicians();

  return {
    interventions,
    technicians,
    loading: interventionsLoading || techniciansLoading,
  };
}
