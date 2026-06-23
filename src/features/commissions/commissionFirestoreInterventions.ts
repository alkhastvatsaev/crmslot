import {
  addDoc,
  collection,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  type Firestore,
} from "firebase/firestore";
import type { InterventionCommission } from "./types";
import {
  COMMISSION_AUDIT_COLLECTION,
  COMMISSION_OVERRIDES_COLLECTION,
  type CommissionAuditAction,
  type CommissionAuditRow,
  type CompanyCommissionAuditRow,
} from "./commissionFirestoreTypes";

export async function appendCommissionAuditEntry(
  db: Firestore,
  params: {
    companyId: string;
    interventionId: string;
    action: CommissionAuditAction;
    finalCommissionAmount: number;
    byUid: string;
    reason?: string | null;
  }
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

export function subscribeInterventionCommission(
  db: Firestore,
  interventionId: string,
  onRow: (row: InterventionCommission | null) => void
): () => void {
  const id = interventionId.trim();
  if (!id) {
    onRow(null);
    return () => {};
  }
  return onSnapshot(
    doc(db, COMMISSION_OVERRIDES_COLLECTION, id),
    (snap) => {
      if (!snap.exists()) {
        onRow(null);
        return;
      }
      onRow({ id: snap.id, ...(snap.data() as Omit<InterventionCommission, "id">) });
    },
    () => onRow(null)
  );
}

export async function getInterventionCommission(
  db: Firestore,
  interventionId: string
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
  auditReason: string
): Promise<void> {
  const ref = doc(db, COMMISSION_OVERRIDES_COLLECTION, override.interventionId);
  await setDoc(ref, { ...override, updatedAt: new Date().toISOString() }, { merge: true });

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

export function subscribeCompanyCommissionAudit(
  db: Firestore,
  companyId: string,
  onRows: (rows: CompanyCommissionAuditRow[]) => void,
  limitCount = 80
): () => void {
  const cid = companyId.trim();
  if (!cid) {
    onRows([]);
    return () => {};
  }
  const q = query(
    collection(db, COMMISSION_AUDIT_COLLECTION),
    where("companyId", "==", cid),
    orderBy("at", "desc")
  );
  return onSnapshot(
    q,
    (snap) => {
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
    },
    () => onRows([])
  );
}

export function subscribeCommissionAudit(
  db: Firestore,
  interventionId: string,
  onRows: (rows: CommissionAuditRow[]) => void
): () => void {
  if (!interventionId) {
    onRows([]);
    return () => {};
  }
  const q = query(
    collection(db, COMMISSION_AUDIT_COLLECTION),
    where("interventionId", "==", interventionId),
    orderBy("at", "asc")
  );
  return onSnapshot(
    q,
    (snap) =>
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
        })
      ),
    () => onRows([])
  );
}
