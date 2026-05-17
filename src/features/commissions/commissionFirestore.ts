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
  return ref.id;
}

export async function deleteCommissionRule(db: Firestore, ruleId: string): Promise<void> {
  await updateDoc(doc(db, COMMISSION_RULES_COLLECTION, ruleId), {
    isActive: false,
    updatedAt: new Date().toISOString(),
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

  await addDoc(collection(db, COMMISSION_AUDIT_COLLECTION), {
    companyId,
    interventionId: override.interventionId,
    action: "override",
    finalCommissionAmount: override.finalCommissionAmount,
    reason: auditReason,
    byUid: auditByUid,
    at: serverTimestamp(),
  });
}

export function subscribeCommissionAudit(
  db: Firestore,
  interventionId: string,
  onRows: (rows: { id: string; action: string; finalCommissionAmount: number; reason?: string; byUid: string; at: unknown }[]) => void,
): () => void {
  if (!interventionId) { onRows([]); return () => {}; }
  const q = query(
    collection(db, COMMISSION_AUDIT_COLLECTION),
    where("interventionId", "==", interventionId),
    orderBy("at", "asc"),
  );
  return onSnapshot(q, (snap) =>
    onRows(snap.docs.map((d) => ({ id: d.id, ...d.data() } as { id: string; action: string; finalCommissionAmount: number; reason?: string; byUid: string; at: unknown }))),
  );
}
