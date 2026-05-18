import {
  collection, onSnapshot, addDoc, updateDoc, doc,
  query, where, orderBy, serverTimestamp, type Firestore,
} from "firebase/firestore";
import type { Claim, ClaimStatus } from "./types";

const col = (db: Firestore, companyId: string) =>
  collection(db, "companies", companyId, "claims");

export function subscribeClaims(
  db: Firestore,
  companyId: string,
  onData: (claims: Claim[]) => void,
): () => void {
  const q = query(col(db, companyId), orderBy("createdAt", "desc"));
  return onSnapshot(q, (snap) =>
    onData(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Claim, "id">) }))),
  );
}

export function subscribeClaimsByIntervention(
  db: Firestore,
  companyId: string,
  interventionId: string,
  onData: (claims: Claim[]) => void,
): () => void {
  const q = query(
    col(db, companyId),
    where("interventionId", "==", interventionId),
    orderBy("createdAt", "desc"),
  );
  return onSnapshot(q, (snap) =>
    onData(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Claim, "id">) }))),
  );
}

export async function createClaim(
  db: Firestore,
  companyId: string,
  data: Pick<Claim, "interventionId" | "category" | "description" | "clientId" | "clientName" | "createdByUid">,
): Promise<string> {
  const ref = await addDoc(col(db, companyId), {
    ...data,
    companyId,
    status: "open" as ClaimStatus,
    resolution: null,
    resolvedAt: null,
    assignedToUid: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateClaimStatus(
  db: Firestore,
  companyId: string,
  claimId: string,
  status: ClaimStatus,
  resolution?: string,
): Promise<void> {
  const now = new Date().toISOString();
  await updateDoc(doc(db, "companies", companyId, "claims", claimId), {
    status,
    ...(resolution ? { resolution } : {}),
    ...(status === "resolved" || status === "rejected" ? { resolvedAt: now } : {}),
    updatedAt: serverTimestamp(),
  });
}
