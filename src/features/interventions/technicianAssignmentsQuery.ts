import { isIosPhonePowerSave } from "@/core/perf/iosPhonePowerSave";
import { IOS_FIRESTORE_POLL_MS } from "@/core/firestore/iosFirestorePolling";
import {
  collection,
  getDocs,
  getDocsFromServer,
  query,
  where,
  type Firestore,
} from "firebase/firestore";
import type { Intervention } from "@/features/interventions/types";

export function technicianAssignmentsFirestoreQuery(db: Firestore, technicianUid: string) {
  return query(
    collection(db, "interventions"),
    where("assignedTechnicianUid", "==", technicianUid)
  );
}

export async function fetchTechnicianAssignments(
  db: Firestore,
  technicianUid: string,
  opts?: { fromServer?: boolean }
): Promise<Intervention[]> {
  const uid = technicianUid.trim();
  if (!uid) return [];
  const q = technicianAssignmentsFirestoreQuery(db, uid);
  const snapshot = opts?.fromServer ? await getDocsFromServer(q) : await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as Intervention);
}

/** Intervalle de resync quand l’app terrain reste ouverte (listener Firestore parfois muet sur mobile). */
export const TECHNICIAN_ASSIGNMENTS_POLL_MS = 12_000;
export const TECHNICIAN_ASSIGNMENTS_POLL_MS_MOBILE = 180_000;

export function resolveTechnicianAssignmentsPollMs(
  userAgent: string = typeof navigator !== "undefined" ? navigator.userAgent : ""
): number {
  if (isIosPhonePowerSave(userAgent)) return IOS_FIRESTORE_POLL_MS;
  return TECHNICIAN_ASSIGNMENTS_POLL_MS;
}
