import type * as admin from "firebase-admin";
import type { Technician } from "@/features/technicians/types";

/** Charge les techniciens terrain (collection racine `technicians`). */
export async function loadTechniciansAdmin(db: admin.firestore.Firestore): Promise<Technician[]> {
  const snap = await db.collection("technicians").get();
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Technician, "id">) }));
}
