import type * as admin from "firebase-admin";

/** Taille pratique pour `getAll` Admin — latence stable sous charge. */
export const FIRESTORE_GET_ALL_CHUNK_SIZE = 30;

/** Récupère des snapshots Firestore par lots (évite un `getAll` géant). */
export async function batchedFirestoreGetAll(
  db: admin.firestore.Firestore,
  docRefs: admin.firestore.DocumentReference[]
): Promise<admin.firestore.DocumentSnapshot[]> {
  if (docRefs.length === 0) return [];

  const snaps: admin.firestore.DocumentSnapshot[] = [];
  for (let offset = 0; offset < docRefs.length; offset += FIRESTORE_GET_ALL_CHUNK_SIZE) {
    const chunk = docRefs.slice(offset, offset + FIRESTORE_GET_ALL_CHUNK_SIZE);
    const batch = await db.getAll(...chunk);
    snaps.push(...batch);
  }
  return snaps;
}
