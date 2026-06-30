import type { ManualCommissionEntry } from "@/features/commissions";
import type { CommissionRule } from "@/features/commissions";
import type { Intervention } from "@/features/interventions";
import type { Technician } from "@/features/technicians";
import {
  findTechnicianByAssignUid,
  resolveCanonicalTechnicianAssignUid,
  resolveTechnicianAuthUid,
  shouldUpgradeTechnicianDisplayLabel,
  technicianProfileInitial,
} from "@/features/technicians/resolveTechnicianIdentity";
import {
  buildStaffDisplayLookup,
  resolvePatronTechnicianDisplayName,
} from "@/features/commissionsHub/commissionsHubStaffDisplay";
import type { CompanyStaffMember } from "@/features/teamHub/types";
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
  staffMembers?: CompanyStaffMember[];
  now?: Date;
}): PatronTechnicianRow[] {
  const now = params.now ?? new Date();
  const monthKey = monthKeyFromDate(now);
  const staffLookup = buildStaffDisplayLookup(params.staffMembers ?? []);

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
    if (
      shouldUpgradeTechnicianDisplayLabel(existing.name, uid) &&
      name.trim() &&
      !shouldUpgradeTechnicianDisplayLabel(name, uid)
    ) {
      existing.name = name;
      existing.initial = initial;
    }
    existing.alternateTargetIds = [
      ...new Set([...existing.alternateTargetIds, ...alternateTargetIds.filter(Boolean)]),
    ];
    return existing;
  };

  const rowIdentityForUid = (uid: string) => {
    const tech = findTechnicianByAssignUid(params.technicians, uid);
    const name = resolvePatronTechnicianDisplayName(uid, tech, staffLookup);
    const initial = technicianProfileInitial(tech, name);
    const alternates = tech
      ? [tech.id.trim(), resolveTechnicianAuthUid(tech)].filter((id) => id && id !== uid)
      : [];
    return { name, initial, alternates };
  };

  for (const tech of params.technicians) {
    const docId = tech.id.trim();
    const authUid = resolveTechnicianAuthUid(tech);
    const canonicalUid = authUid || docId;
    if (!canonicalUid) continue;
    const name = resolvePatronTechnicianDisplayName(canonicalUid, tech, staffLookup);
    const initial = technicianProfileInitial(tech, name);
    const alternates = [docId, authUid].filter((id) => id && id !== canonicalUid);
    ensure(canonicalUid, name, initial, alternates);
  }

  const resolveAssignedUid = (rawUid: string): string =>
    resolveCanonicalTechnicianAssignUid(params.technicians, rawUid);

  for (const iv of params.interventions) {
    if (interventionCommissionMonth(iv) !== monthKey) continue;
    const uid = resolveAssignedUid(iv.assignedTechnicianUid ?? "");
    if (!uid) continue;
    const cents = iv.commissionAmountCents ?? 0;
    if (cents <= 0) continue;
    const identity = rowIdentityForUid(uid);
    const row = ensure(uid, identity.name, identity.initial, identity.alternates);
    row.missionCents += cents;
    row.missionCount += 1;
  }

  for (const iv of params.interventions) {
    if (interventionRevenueMonth(iv) !== monthKey) continue;
    const uid = resolveAssignedUid(iv.assignedTechnicianUid ?? "");
    if (!uid) continue;
    const revenueCents = interventionTechnicianRevenueCents(iv);
    if (revenueCents <= 0) continue;
    const identity = rowIdentityForUid(uid);
    const row = ensure(uid, identity.name, identity.initial, identity.alternates);
    row.revenueCents += revenueCents;
    row.revenueMissionCount += 1;
  }

  for (const entry of params.manualEntries) {
    if (manualEntryMonth(entry) !== monthKey) continue;
    const uid = resolveAssignedUid(entry.technicianUid);
    if (!uid) continue;
    const identity = rowIdentityForUid(uid);
    const row = ensure(uid, identity.name, identity.initial, identity.alternates);
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
