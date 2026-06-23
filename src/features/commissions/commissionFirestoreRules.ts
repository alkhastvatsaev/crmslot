import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
  type Firestore,
} from "firebase/firestore";
import type { CommissionRule } from "./types";
import {
  matchPersonalTechnicianRules,
  normalizeCommissionRule,
  pickPersonalTechnicianRule,
} from "@/features/commissions/commissionRuleMatching";
import {
  COMMISSION_RULE_AUDIT_COLLECTION,
  COMMISSION_RULES_COLLECTION,
  type CommissionRuleAuditAction,
  type CommissionRuleAuditRow,
  type CommissionRuleSnapshot,
} from "./commissionFirestoreTypes";

export async function appendCommissionRuleAuditEntry(
  db: Firestore,
  params: {
    companyId: string;
    ruleId: string;
    action: CommissionRuleAuditAction;
    byUid: string;
    snapshot?: CommissionRuleSnapshot;
  }
): Promise<void> {
  const companyId = params.companyId.trim();
  if (!companyId) return;
  try {
    await addDoc(collection(db, COMMISSION_RULE_AUDIT_COLLECTION), {
      companyId,
      ruleId: params.ruleId,
      action: params.action,
      byUid: params.byUid,
      level: params.snapshot?.level ?? null,
      targetId: params.snapshot?.targetId ?? null,
      valueType: params.snapshot?.valueType ?? null,
      value: params.snapshot?.value ?? null,
      at: serverTimestamp(),
    });
  } catch {
    /* audit best-effort — ne bloque pas la règle métier */
  }
}

export function subscribeCommissionRules(
  db: Firestore,
  companyId: string,
  onRows: (rows: CommissionRule[]) => void,
  onError?: (e: Error) => void
): () => void {
  const cid = companyId.trim();
  if (!cid) {
    onRows([]);
    return () => {};
  }
  const q = query(collection(db, COMMISSION_RULES_COLLECTION), where("companyId", "==", cid));
  return onSnapshot(
    q,
    (snap) => {
      const rows = snap.docs
        .map((d) => normalizeCommissionRule({ id: d.id, ...d.data() } as CommissionRule))
        .filter((r) => r.isActive !== false)
        .sort(
          (a, b) => new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime()
        );
      onRows(rows);
    },
    (e) => onError?.(e instanceof Error ? e : new Error(String(e)))
  );
}

export async function createCommissionRule(
  db: Firestore,
  companyId: string,
  params: Pick<CommissionRule, "level" | "targetId" | "valueType" | "value" | "createdByUid">
): Promise<string> {
  const ref = await addDoc(collection(db, COMMISSION_RULES_COLLECTION), {
    companyId,
    ...params,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
  await appendCommissionRuleAuditEntry(db, {
    companyId,
    ruleId: ref.id,
    action: "created",
    byUid: params.createdByUid,
    snapshot: params,
  });
  return ref.id;
}

export async function updateCommissionRule(
  db: Firestore,
  ruleId: string,
  companyId: string,
  patch: CommissionRuleSnapshot,
  byUid: string
): Promise<void> {
  await updateDoc(doc(db, COMMISSION_RULES_COLLECTION, ruleId), {
    ...patch,
    updatedAt: new Date().toISOString(),
  });
  await appendCommissionRuleAuditEntry(db, {
    companyId,
    ruleId,
    action: "updated",
    byUid,
    snapshot: patch,
  });
}

export async function deleteCommissionRule(
  db: Firestore,
  ruleId: string,
  companyId: string,
  byUid: string,
  snapshot?: CommissionRuleSnapshot
): Promise<void> {
  await updateDoc(doc(db, COMMISSION_RULES_COLLECTION, ruleId), {
    isActive: false,
    updatedAt: new Date().toISOString(),
  });
  await appendCommissionRuleAuditEntry(db, {
    companyId,
    ruleId,
    action: "deactivated",
    byUid,
    snapshot,
  });
}

export async function upsertTechnicianCommissionRule(
  db: Firestore,
  companyId: string,
  params: {
    technicianUid: string;
    alternateTargetIds?: string[];
    valueType: CommissionRule["valueType"];
    value: number;
    byUid: string;
    activeRules: CommissionRule[];
  }
): Promise<string> {
  const primaryUid = params.technicianUid.trim();
  if (!primaryUid) throw new Error("technicianUid required");

  const alternates = params.alternateTargetIds ?? [];
  const matches = matchPersonalTechnicianRules(params.activeRules, primaryUid, alternates);
  const payload = {
    level: "technician" as const,
    targetId: primaryUid,
    valueType: params.valueType,
    value: params.value,
  };

  const keeper = pickPersonalTechnicianRule(params.activeRules, primaryUid, alternates);
  let ruleId: string;
  if (keeper) {
    await updateCommissionRule(db, keeper.id, companyId, payload, params.byUid);
    ruleId = keeper.id;
  } else {
    ruleId = await createCommissionRule(db, companyId, { ...payload, createdByUid: params.byUid });
  }

  for (const duplicate of matches) {
    if (duplicate.id === ruleId) continue;
    await deleteCommissionRule(db, duplicate.id, companyId, params.byUid, {
      level: duplicate.level,
      targetId: duplicate.targetId,
      valueType: duplicate.valueType,
      value: duplicate.value,
    });
  }

  return ruleId;
}

export function subscribeCommissionRuleAudit(
  db: Firestore,
  companyId: string,
  onRows: (rows: CommissionRuleAuditRow[]) => void,
  limitCount = 80
): () => void {
  const cid = companyId.trim();
  if (!cid) {
    onRows([]);
    return () => {};
  }
  const q = query(
    collection(db, COMMISSION_RULE_AUDIT_COLLECTION),
    where("companyId", "==", cid),
    orderBy("at", "desc")
  );
  return onSnapshot(
    q,
    (snap) => {
      onRows(
        snap.docs.slice(0, limitCount).map((d) => {
          const data = d.data();
          return {
            id: d.id,
            companyId: cid,
            ruleId: String(data.ruleId ?? ""),
            action: String(data.action ?? "unknown") as CommissionRuleAuditAction,
            level: typeof data.level === "string" ? data.level : undefined,
            targetId: typeof data.targetId === "string" ? data.targetId : undefined,
            valueType: typeof data.valueType === "string" ? data.valueType : undefined,
            value: typeof data.value === "number" ? data.value : undefined,
            byUid: String(data.byUid ?? ""),
            at: data.at,
          };
        })
      );
    },
    () => onRows([])
  );
}
