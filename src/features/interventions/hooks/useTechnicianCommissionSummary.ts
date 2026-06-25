"use client";

import { useEffect, useMemo, useState } from "react";
import { firestore } from "@/core/config/firebase";
import { useCompanyWorkspaceOptional } from "@/context/CompanyWorkspaceContext";
import { resolveHubCompanyId } from "@/features/company/resolveHubCompanyId";
import {
  subscribeManualCommissions,
  type ManualCommissionEntry,
} from "@/features/commissions/commissionFirestore";
import { useCommissionRules } from "@/features/commissions/useCommissionRules";
import {
  buildPatronMonthlySeries,
  buildPatronTechnicianRows,
  buildPatronTrend,
  resolveTechnicianPayablePreviewCents,
  resolveTechnicianRateValue,
  type PatronMonthlyPoint,
  type PatronTechnicianRow,
  type PatronTrend,
} from "@/features/commissionsHub/commissionsHubPatronMetrics";
import type { Intervention } from "@/features/interventions/types";
import {
  filterInterventionsForTechnicianCommission,
  filterManualEntriesForTechnicianCommission,
} from "@/features/interventions/technicianCommissionScope";
import type { Technician } from "@/features/technicians";

type Summary = {
  companyPhase: "loading" | "ready" | "missing";
  loading: boolean;
  row: PatronTechnicianRow | null;
  payableCents: number;
  revenueTrend: PatronTrend;
  commissionTrend: PatronTrend;
  monthlySeries: PatronMonthlyPoint[];
  rateLabel: string;
  hasPersonalRule: boolean;
};

function findCurrentTechnician(
  technicians: Technician[],
  technicianUid: string | null
): Technician | null {
  const uid = (technicianUid ?? "").trim();
  if (!uid) return null;
  return (
    technicians.find((tech) => (tech.authUid ?? "").trim() === uid || tech.id.trim() === uid) ??
    null
  );
}

export function useTechnicianCommissionSummary(params: {
  technicianUid: string | null;
  interventions: Intervention[];
  technicians: Technician[];
  enabled?: boolean;
}): Summary {
  const enabled = params.enabled !== false;
  const workspace = useCompanyWorkspaceOptional();
  const { companyId, phase: companyPhase } = resolveHubCompanyId(workspace);
  const activeCompanyId = enabled ? companyId : null;

  const { rules, loading: rulesLoading } = useCommissionRules(activeCompanyId);
  const [manualEntries, setManualEntries] = useState<ManualCommissionEntry[]>([]);
  const [manualLoading, setManualLoading] = useState(true);

  useEffect(() => {
    if (!activeCompanyId || !firestore) {
      setManualEntries([]);
      setManualLoading(false);
      return;
    }
    setManualLoading(true);
    return subscribeManualCommissions(firestore, activeCompanyId, (rows) => {
      setManualEntries(rows);
      setManualLoading(false);
    });
  }, [activeCompanyId]);

  const scopedInterventions = useMemo(
    () =>
      filterInterventionsForTechnicianCommission(
        params.interventions,
        params.technicianUid,
        params.technicians
      ),
    [params.interventions, params.technicianUid, params.technicians]
  );

  const scopedManualEntries = useMemo(
    () =>
      filterManualEntriesForTechnicianCommission(
        manualEntries,
        params.technicianUid,
        params.technicians
      ),
    [manualEntries, params.technicianUid, params.technicians]
  );

  const currentTechnician = useMemo(
    () => findCurrentTechnician(params.technicians, params.technicianUid),
    [params.technicians, params.technicianUid]
  );

  const row = useMemo(() => {
    if (!activeCompanyId || !params.technicianUid?.trim()) return null;
    const technicians = currentTechnician ? [currentTechnician] : [];
    const rows = buildPatronTechnicianRows({
      interventions: scopedInterventions,
      manualEntries: scopedManualEntries,
      rules,
      companyId: activeCompanyId,
      technicians,
    });
    const uid = params.technicianUid.trim();
    return rows.find((item) => item.uid === uid) ?? rows[0] ?? null;
  }, [
    activeCompanyId,
    currentTechnician,
    params.technicianUid,
    rules,
    scopedInterventions,
    scopedManualEntries,
  ]);

  const monthlySeries = useMemo(
    () =>
      buildPatronMonthlySeries({
        interventions: scopedInterventions,
        manualEntries: scopedManualEntries,
        months: 6,
      }),
    [scopedInterventions, scopedManualEntries]
  );

  const revenueTrend = useMemo(
    () => buildPatronTrend(monthlySeries, "revenueCents"),
    [monthlySeries]
  );
  const commissionTrend = useMemo(
    () => buildPatronTrend(monthlySeries, "commissionCents"),
    [monthlySeries]
  );

  const payableCents = row ? resolveTechnicianPayablePreviewCents(row) : 0;
  const { valueType, value } = row
    ? resolveTechnicianRateValue(row)
    : { valueType: "percentage" as const, value: 0 };
  const rateLabel = valueType === "percentage" ? `${value}%` : `${value} €`;

  const loading =
    companyPhase === "loading" || (Boolean(activeCompanyId) && (rulesLoading || manualLoading));

  return {
    companyPhase,
    loading,
    row,
    payableCents,
    revenueTrend,
    commissionTrend,
    monthlySeries,
    rateLabel,
    hasPersonalRule: row?.hasPersonalRule ?? false,
  };
}
