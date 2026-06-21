import type * as admin from "firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import {
  COMMISSION_RULES_COLLECTION,
  COMMISSION_RULE_AUDIT_COLLECTION,
} from "@/features/commissions/commissionFirestore";
import {
  matchPersonalTechnicianRules,
  normalizeCommissionRule,
  pickPersonalTechnicianRule,
} from "@/features/commissions/commissionRuleMatching";
import type { CommissionRule, CommissionValueType } from "@/features/commissions/types";

function sortRules(rows: CommissionRule[]): CommissionRule[] {
  return [...rows].sort(
    (a, b) => new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime()
  );
}

export async function listActiveCommissionRulesAdmin(
  db: admin.firestore.Firestore,
  companyId: string
): Promise<CommissionRule[]> {
  const cid = companyId.trim();
  if (!cid) return [];
  const snap = await db.collection(COMMISSION_RULES_COLLECTION).where("companyId", "==", cid).get();
  return sortRules(
    snap.docs
      .map((d) => normalizeCommissionRule({ id: d.id, ...d.data() } as CommissionRule))
      .filter((r) => r.isActive !== false)
  );
}

async function appendRuleAuditAdmin(
  db: admin.firestore.Firestore,
  params: {
    companyId: string;
    ruleId: string;
    action: "created" | "updated" | "deactivated";
    byUid: string;
    snapshot?: Pick<CommissionRule, "level" | "targetId" | "valueType" | "value">;
  }
): Promise<void> {
  try {
    await db.collection(COMMISSION_RULE_AUDIT_COLLECTION).add({
      companyId: params.companyId,
      ruleId: params.ruleId,
      action: params.action,
      byUid: params.byUid,
      level: params.snapshot?.level ?? null,
      targetId: params.snapshot?.targetId ?? null,
      valueType: params.snapshot?.valueType ?? null,
      value: params.snapshot?.value ?? null,
      at: FieldValue.serverTimestamp(),
    });
  } catch {
    /* audit best-effort */
  }
}

export async function upsertTechnicianCommissionRuleAdmin(
  db: admin.firestore.Firestore,
  companyId: string,
  params: {
    technicianUid: string;
    alternateTargetIds?: string[];
    valueType: CommissionValueType;
    value: number;
    byUid: string;
  }
): Promise<{ ruleId: string; value: number }> {
  const cid = companyId.trim();
  const primaryUid = params.technicianUid.trim();
  if (!cid || !primaryUid) throw new Error("companyId et technicianUid requis");

  const alternates = params.alternateTargetIds ?? [];
  const activeRules = await listActiveCommissionRulesAdmin(db, cid);
  const matches = matchPersonalTechnicianRules(activeRules, primaryUid, alternates);
  const payload = {
    level: "technician" as const,
    targetId: primaryUid,
    valueType: params.valueType,
    value: params.value,
  };

  const keeper = pickPersonalTechnicianRule(activeRules, primaryUid, alternates);
  const now = new Date().toISOString();
  let ruleId: string;

  if (keeper) {
    await db
      .collection(COMMISSION_RULES_COLLECTION)
      .doc(keeper.id)
      .update({
        ...payload,
        companyId: cid,
        isActive: true,
        updatedAt: now,
      });
    ruleId = keeper.id;
    await appendRuleAuditAdmin(db, {
      companyId: cid,
      ruleId,
      action: "updated",
      byUid: params.byUid,
      snapshot: payload,
    });
  } else {
    const ref = await db.collection(COMMISSION_RULES_COLLECTION).add({
      companyId: cid,
      ...payload,
      isActive: true,
      createdAt: now,
      updatedAt: now,
      createdByUid: params.byUid,
    });
    ruleId = ref.id;
    await appendRuleAuditAdmin(db, {
      companyId: cid,
      ruleId,
      action: "created",
      byUid: params.byUid,
      snapshot: payload,
    });
  }

  for (const duplicate of matches) {
    if (duplicate.id === ruleId) continue;
    await db.collection(COMMISSION_RULES_COLLECTION).doc(duplicate.id).update({
      isActive: false,
      updatedAt: now,
    });
    await appendRuleAuditAdmin(db, {
      companyId: cid,
      ruleId: duplicate.id,
      action: "deactivated",
      byUid: params.byUid,
      snapshot: {
        level: duplicate.level,
        targetId: duplicate.targetId,
        valueType: duplicate.valueType,
        value: duplicate.value,
      },
    });
  }

  return { ruleId, value: payload.value };
}
