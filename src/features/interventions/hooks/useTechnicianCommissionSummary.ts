"use client";

import { useEffect, useMemo, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth, firestore } from "@/core/config/firebase";
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
import {
  findTechnicianByAssignUid,
  resolveCanonicalTechnicianAssignUid,
  resolveTechnicianProfileLabel,
} from "@/features/technicians/resolveTechnicianIdentity";

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
  displayName: string;
};

function findCurrentTechnician(
  technicians: Technician[],
  technicianUid: string | null,
  email?: string
): Technician | null {
  return findTechnicianByAssignUid(technicians, technicianUid ?? "", { email }) ?? null;
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
  const [authProfile, setAuthProfile] = useState({ displayName: "", email: "" });

  useEffect(() => {
    if (!auth) return () => {};
    return onAuthStateChanged(auth, (user) => {
      setAuthProfile({
        displayName: user?.displayName?.trim() ?? "",
        email: user?.email?.trim() ?? "",
      });
    });
  }, []);

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
        params.technicians,
        authProfile.email
      ),
    [authProfile.email, params.interventions, params.technicianUid, params.technicians]
  );

  const scopedManualEntries = useMemo(
    () =>
      filterManualEntriesForTechnicianCommission(
        manualEntries,
        params.technicianUid,
        params.technicians,
        authProfile.email
      ),
    [authProfile.email, manualEntries, params.technicianUid, params.technicians]
  );

  const currentTechnician = useMemo(
    () => findCurrentTechnician(params.technicians, params.technicianUid, authProfile.email),
    [authProfile.email, params.technicians, params.technicianUid]
  );

  const row = useMemo(() => {
    if (!activeCompanyId || !params.technicianUid?.trim()) return null;
    const rows = buildPatronTechnicianRows({
      interventions: scopedInterventions,
      manualEntries: scopedManualEntries,
      rules,
      companyId: activeCompanyId,
      technicians: params.technicians,
    });
    const canonicalUid = resolveCanonicalTechnicianAssignUid(
      params.technicians,
      params.technicianUid
    );
    return (
      rows.find((item) => item.uid === canonicalUid) ??
      rows.find((item) => item.alternateTargetIds.includes(canonicalUid)) ??
      null
    );
  }, [
    activeCompanyId,
    params.technicianUid,
    params.technicians,
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

  const displayName = useMemo(
    () => resolveTechnicianProfileLabel(currentTechnician, authProfile),
    [authProfile, currentTechnician]
  );

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
    displayName,
  };
}
