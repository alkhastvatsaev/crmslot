import { openDB, type IDBPDatabase } from "idb";

export type CompletionQueueRecord = {
  localId: string;
  interventionId: string;
  photoDataUrls: string[];
  signaturePngDataUrl: string;
  queuedAtMs: number;
  /** Tentatives d'envoi déjà effectuées (incrémenté à chaque échec). */
  attemptCount?: number;
  /** Timestamp epoch après lequel l'item est éligible à un retry. */
  nextAttemptAtMs?: number;
  billingLines?: {
    description: string;
    quantity: number;
    unitPriceCents: number;
    reference?: string;
  }[];
};

const DB_NAME = "bm-tech-offline-v1";
const STORE = "completion-queue";
const DB_VERSION = 2;

let dbPromise: Promise<IDBPDatabase> | null = null;

function getDb(): Promise<IDBPDatabase> {
  if (typeof window === "undefined") {
    throw new Error("[completionQueueDb] IndexedDB requiert un navigateur");
  }
  dbPromise ??= openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: "localId" });
      }
      // v2 : ajoute attemptCount / nextAttemptAtMs aux records existants (rétro-compatible).
    },
  });
  return dbPromise;
}

export async function completionQueuePut(record: CompletionQueueRecord): Promise<void> {
  const db = await getDb();
  await db.put(STORE, record);
}

export async function completionQueueDelete(localId: string): Promise<void> {
  const db = await getDb();
  await db.delete(STORE, localId);
}

export async function completionQueueGetAll(): Promise<CompletionQueueRecord[]> {
  const db = await getDb();
  return db.getAll(STORE);
}

export async function completionQueueCount(): Promise<number> {
  const db = await getDb();
  return db.count(STORE);
}
