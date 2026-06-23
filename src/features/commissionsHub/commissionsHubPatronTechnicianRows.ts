import type { ManualCommissionEntry } from "@/features/commissions/commissionFirestore";
import type { CommissionRule } from "@/features/commissions/types";
import {
  canResolveTechnicianAssignUid,
  resolveTechnicianAssignUid,
} from "@/features/dispatch/technicianAssignUid";
import type { Intervention } from "@/features/interventions/types";
import type { Technician } from "@/features/technicians/types";
import {
  interventionCommissionMonth,
  interventionRevenueMonth,
  interventionTechnicianRevenueCents,
  manualEntryMonth,
  monthKeyFromDate,
} from "@/features/commissionsHub/commissionsHubPatronMonthKeys";
import { resolveTechnicianDisplayRule } from "@/features/commissionsHub/commissionsHubPatronRules";
import type { PatronTechnicianRow } from "@/features/commissionsHub/commissionsHubPatronMetricsTypes";

export function buildPatronTechnicianRows(params: {
  interventions: Intervention[];
  manualEntries: ManualCommissionEntry[];
  rules: CommissionRule[];
  companyId: string;
  technicians: Technician[];
  now?: Date;
}): PatronTechnicianRow[] {
  const now = params.now ?? new Date();
  const monthKey = monthKeyFromDate(now);

  const byUid = new Map<
    string,
    {
      name: string;
      initial: string;
      alternateTargetIds: string[];
      missionCents: number;
      missionCount: number;
      manualCents: number;
      revenueCents: number;
      revenueMissionCount: number;
    }
  >();

  const ensure = (
    uid: string,
    name: string,
    initial: string,
    alternateTargetIds: string[] = []
  ) => {
    const existing = byUid.get(uid);
    if (!existing) {
      byUid.set(uid, {
        name,
        initial,
        alternateTargetIds: [...new Set(alternateTargetIds.filter(Boolean))],
        missionCents: 0,
        missionCount: 0,
        manualCents: 0,
        revenueCents: 0,
        revenueMissionCount: 0,
      });
      return byUid.get(uid)!;
    }
    existing.alternateTargetIds = [
      ...new Set([...existing.alternateTargetIds, ...alternateTargetIds.filter(Boolean)]),
    ];
    return existing;
  };

  for (const tech of params.technicians) {
    if (canResolveTechnicianAssignUid(tech)) {
      const uid = resolveTechnicianAssignUid(tech);
      ensure(uid, tech.name, tech.initial, [tech.id]);
      continue;
    }
    const fallbackId = tech.id.trim();
    if (fallbackId) ensure(fallbackId, tech.name, tech.initial, []);
  }

  const assignUidByDocId = new Map(
    params.technicians
      .filter((tech) => canResolveTechnicianAssignUid(tech))
      .map((tech) => [tech.id.trim(), resolveTechnicianAssignUid(tech)] as const)
      .filter(([docId]) => Boolean(docId))
  );

  const resolveAssignedUid = (rawUid: string): string => {
    const trimmed = rawUid.trim();
    return assignUidByDocId.get(trimmed) ?? trimmed;
  };

  for (const iv of params.interventions) {
    if (interventionCommissionMonth(iv) !== monthKey) continue;
    const uid = resolveAssignedUid(iv.assignedTechnicianUid ?? "");
    if (!uid) continue;
    const cents = iv.commissionAmountCents ?? 0;
    if (cents <= 0) continue;
    const row = ensure(uid, uid.slice(-6), uid.slice(0, 1).toUpperCase());
    row.missionCents += cents;
    row.missionCount += 1;
  }

  for (const iv of params.interventions) {
    if (interventionRevenueMonth(iv) !== monthKey) continue;
    const uid = resolveAssignedUid(iv.assignedTechnicianUid ?? "");
    if (!uid) continue;
    const revenueCents = interventionTechnicianRevenueCents(iv);
    if (revenueCents <= 0) continue;
    const row = ensure(uid, uid.slice(-6), uid.slice(0, 1).toUpperCase());
    row.revenueCents += revenueCents;
    row.revenueMissionCount += 1;
  }

  for (const entry of params.manualEntries) {
    if (manualEntryMonth(entry) !== monthKey) continue;
    const uid = resolveAssignedUid(entry.technicianUid);
    if (!uid) continue;
    const row = ensure(uid, uid.slice(-6), uid.slice(0, 1).toUpperCase());
    row.manualCents += Math.round(entry.amountEuros * 100);
  }

  return [...byUid.entries()]
    .map(([uid, row]) => {
      const { personalRule, displayRule, hasPersonalRule } = resolveTechnicianDisplayRule(
        params.rules,
        params.companyId,
        uid,
        row.alternateTargetIds
      );
      return {
        uid,
        name: row.name,
        initial: row.initial,
        alternateTargetIds: row.alternateTargetIds,
        monthEarnedCents: row.missionCents + row.manualCents,
        monthRevenueCents: row.revenueCents,
        revenueMissionCount: row.revenueMissionCount,
        missionCount: row.missionCount,
        manualBonusCents: row.manualCents,
        personalRule,
        displayRule,
        hasPersonalRule,
      };
    })
    .sort((a, b) => b.monthEarnedCents - a.monthEarnedCents);
}
