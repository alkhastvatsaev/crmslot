import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  setDoc,
  getDoc,
  where,
  type Firestore,
} from "firebase/firestore";
import type { CommissionRule, InterventionCommission } from "./types";

export const COMMISSION_RULES_COLLECTION = "commission_rules";
export const COMMISSION_OVERRIDES_COLLECTION = "commission_overrides";
export const COMMISSION_AUDIT_COLLECTION = "commission_audit";
export const COMMISSION_RULE_AUDIT_COLLECTION = "commission_rule_audit";
export const MANUAL_COMMISSIONS_COLLECTION = "manual_commissions";

export type CommissionRuleAuditAction = "created" | "updated" | "deactivated";

export type CommissionRuleAuditRow = {
  id: string;
  companyId: string;
  ruleId: string;
  action: CommissionRuleAuditAction;
  level?: string;
  targetId?: string;
  valueType?: string;
  value?: number;
  byUid: string;
  at: unknown;
};

export type CompanyCommissionAuditRow = CommissionAuditRow & {
  companyId: string;
};

export type ManualCommissionEntry = {
  id: string;
  technicianUid: string;
  amountEuros: number;
  reason: string;
  date: string;
  createdByUid: string;
  createdAt: unknown;
};

export type CommissionAuditRow = {
  id: string;
  interventionId: string;
  action: string;
  finalCommissionAmount: number;
  reason?: string;
  byUid: string;
  at: unknown;
};

export type CommissionAuditAction = "calculated" | "override";

export async function appendCommissionAuditEntry(
  db: Firestore,
  params: {
    companyId: string;
    interventionId: string;
    action: CommissionAuditAction;
    finalCommissionAmount: number;
    byUid: string;
    reason?: string | null;
  },
): Promise<void> {
  const companyId = params.companyId.trim();
  if (!companyId) return;
  await addDoc(collection(db, COMMISSION_AUDIT_COLLECTION), {
    companyId,
    interventionId: params.interventionId,
    action: params.action,
    finalCommissionAmount: params.finalCommissionAmount,
    reason: params.reason?.trim() ? params.reason.trim() : null,
    byUid: params.byUid,
    at: serverTimestamp(),
  });
}

// ─── Rules CRUD ────────────────────────────────────────────────────────────────

export function subscribeCommissionRules(
  db: Firestore,
  companyId: string,
  onRows: (rows: CommissionRule[]) => void,
  onError?: (e: Error) => void,
): () => void {
  const cid = companyId.trim();
  if (!cid) {
    onRows([]);
    return () => {};
  }
  const q = query(
    collection(db, COMMISSION_RULES_COLLECTION),
    where("companyId", "==", cid),
    where("isActive", "==", true),
    orderBy("createdAt", "asc"),
  );
  return onSnapshot(
    q,
    (snap) => onRows(snap.docs.map((d) => ({ id: d.id, ...d.data() } as CommissionRule))),
    (e) => onError?.(e instanceof Error ? e : new Error(String(e))),
  );
}

export async function appendCommissionRuleAuditEntry(
  db: Firestore,
  params: {
    companyId: string;
    ruleId: string;
    action: CommissionRuleAuditAction;
    byUid: string;
    snapshot?: Pick<CommissionRule, "level" | "targetId" | "valueType" | "value">;
  },
): Promise<void> {
  const companyId = params.companyId.trim();
  if (!companyId) return;
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
}

export async function createCommissionRule(
  db: Firestore,
  companyId: string,
  params: Pick<CommissionRule, "level" | "targetId" | "valueType" | "value" | "createdByUid">,
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
  patch: Pick<CommissionRule, "level" | "targetId" | "valueType" | "value">,
  byUid: string,
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
  snapshot?: Pick<CommissionRule, "level" | "targetId" | "valueType" | "value">,
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

// ─── Override per intervention ──────────────────────────────────────────────────

export function subscribeInterventionCommission(
  db: Firestore,
  interventionId: string,
  onRow: (row: InterventionCommission | null) => void,
): () => void {
  const id = interventionId.trim();
  if (!id) {
    onRow(null);
    return () => {};
  }
  return onSnapshot(doc(db, COMMISSION_OVERRIDES_COLLECTION, id), (snap) => {
    if (!snap.exists()) {
      onRow(null);
      return;
    }
    onRow({ id: snap.id, ...(snap.data() as Omit<InterventionCommission, "id">) });
  });
}

export async function getInterventionCommission(
  db: Firestore,
  interventionId: string,
): Promise<InterventionCommission | null> {
  const snap = await getDoc(doc(db, COMMISSION_OVERRIDES_COLLECTION, interventionId.trim()));
  if (!snap.exists()) return null;
  return { id: snap.id, ...(snap.data() as Omit<InterventionCommission, "id">) };
}

export async function saveCommissionOverride(
  db: Firestore,
  companyId: string,
  override: Omit<InterventionCommission, "id">,
  auditByUid: string,
  auditReason: string,
): Promise<void> {
  const ref = doc(db, COMMISSION_OVERRIDES_COLLECTION, override.interventionId);
  await setDoc(
    ref,
    { ...override, updatedAt: new Date().toISOString() },
    { merge: true },
  );

  await updateDoc(doc(db, "interventions", override.interventionId), {
    commissionAmountCents: Math.round(override.finalCommissionAmount * 100),
  }).catch(() => {});

  await appendCommissionAuditEntry(db, {
    companyId,
    interventionId: override.interventionId,
    action: "override",
    finalCommissionAmount: override.finalCommissionAmount,
    byUid: auditByUid,
    reason: auditReason,
  });
}

// ─── Manual commission entries ──────────────────────────────────────────────────

export async function createManualCommission(
  db: Firestore,
  companyId: string,
  params: Pick<ManualCommissionEntry, "technicianUid" | "amountEuros" | "reason" | "date" | "createdByUid">,
): Promise<string> {
  const ref = await addDoc(
    collection(db, MANUAL_COMMISSIONS_COLLECTION, companyId, "entries"),
    { ...params, createdAt: serverTimestamp() },
  );
  return ref.id;
}

export function subscribeManualCommissions(
  db: Firestore,
  companyId: string,
  onRows: (rows: ManualCommissionEntry[]) => void,
): () => void {
  const cid = companyId.trim();
  if (!cid) { onRows([]); return () => {}; }
  const q = query(
    collection(db, MANUAL_COMMISSIONS_COLLECTION, cid, "entries"),
    orderBy("createdAt", "desc"),
  );
  return onSnapshot(q, (snap) =>
    onRows(
      snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<ManualCommissionEntry, "id">),
      })),
    ),
  );
}

export function subscribeCompanyCommissionAudit(
  db: Firestore,
  companyId: string,
  onRows: (rows: CompanyCommissionAuditRow[]) => void,
  limitCount = 80,
): () => void {
  const cid = companyId.trim();
  if (!cid) {
    onRows([]);
    return () => {};
  }
  const q = query(
    collection(db, COMMISSION_AUDIT_COLLECTION),
    where("companyId", "==", cid),
    orderBy("at", "desc"),
  );
  return onSnapshot(q, (snap) => {
    const rows = snap.docs.slice(0, limitCount).map((d) => {
      const data = d.data();
      return {
        id: d.id,
        companyId: String(data.companyId ?? cid),
        interventionId: String(data.interventionId ?? ""),
        action: String(data.action ?? "unknown"),
        finalCommissionAmount: Number(data.finalCommissionAmount ?? 0),
        reason: typeof data.reason === "string" ? data.reason : undefined,
        byUid: String(data.byUid ?? ""),
        at: data.at,
      } satisfies CompanyCommissionAuditRow;
    });
    onRows(rows);
  });
}

export function subscribeCommissionRuleAudit(
  db: Firestore,
  companyId: string,
  onRows: (rows: CommissionRuleAuditRow[]) => void,
  limitCount = 80,
): () => void {
  const cid = companyId.trim();
  if (!cid) {
    onRows([]);
    return () => {};
  }
  const q = query(
    collection(db, COMMISSION_RULE_AUDIT_COLLECTION),
    where("companyId", "==", cid),
    orderBy("at", "desc"),
  );
  return onSnapshot(q, (snap) => {
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
      }),
    );
  });
}

export function subscribeCommissionAudit(
  db: Firestore,
  interventionId: string,
  onRows: (rows: CommissionAuditRow[]) => void,
): () => void {
  if (!interventionId) { onRows([]); return () => {}; }
  const q = query(
    collection(db, COMMISSION_AUDIT_COLLECTION),
    where("interventionId", "==", interventionId),
    orderBy("at", "asc"),
  );
  return onSnapshot(q, (snap) =>
    onRows(
      snap.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          interventionId: String(data.interventionId ?? interventionId),
          action: String(data.action ?? "unknown"),
          finalCommissionAmount: Number(data.finalCommissionAmount ?? 0),
          reason: typeof data.reason === "string" ? data.reason : undefined,
          byUid: String(data.byUid ?? ""),
          at: data.at,
        } satisfies CommissionAuditRow;
      }),
    ),
  );
}
