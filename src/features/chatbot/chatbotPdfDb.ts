import { openDB, type IDBPDatabase } from "idb";
import type { ChatbotDocumentKind } from "./chatbot-document";

const DB_NAME = "belgmap-pdfs-cache";
const DB_VERSION = 1;
const STORE_NAME = "pdf_blobs";

let dbPromise: Promise<IDBPDatabase> | null = null;

function getDb(): Promise<IDBPDatabase> {
  if (typeof window === "undefined") return Promise.reject(new Error("SSR"));
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      },
    });
  }
  return dbPromise;
}

function getCacheKey(
  interventionId: string,
  kind: ChatbotDocumentKind | "material_order",
  companyId?: string,
  orderId?: string
) {
  if (kind === "material_order") return `supplier_${companyId}_${orderId}`;
  return `intervention_${interventionId}_${kind}`;
}

export async function savePdfToCache(
  interventionId: string,
  kind: ChatbotDocumentKind | "material_order",
  blob: Blob,
  companyId?: string,
  orderId?: string
): Promise<void> {
  try {
    const db = await getDb();
    const key = getCacheKey(interventionId, kind, companyId, orderId);
    await db.put(STORE_NAME, blob, key);
  } catch (e) {
    console.warn("Erreur de sauvegarde PDF en cache", e);
  }
}

export async function getPdfFromCache(
  interventionId: string,
  kind: ChatbotDocumentKind | "material_order",
  companyId?: string,
  orderId?: string
): Promise<Blob | null> {
  try {
    const db = await getDb();
    const key = getCacheKey(interventionId, kind, companyId, orderId);
    return (await db.get(STORE_NAME, key)) as Blob | undefined ?? null;
  } catch (e) {
    console.warn("Erreur de lecture PDF en cache", e);
    return null;
  }
}

export async function removePdfFromCache(
  interventionId: string,
  kind: ChatbotDocumentKind | "material_order",
  companyId?: string,
  orderId?: string
): Promise<void> {
  try {
    const db = await getDb();
    const key = getCacheKey(interventionId, kind, companyId, orderId);
    await db.delete(STORE_NAME, key);
  } catch (e) {
    console.warn("Erreur suppression PDF cache", e);
  }
}
