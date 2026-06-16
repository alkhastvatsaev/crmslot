import type * as admin from "firebase-admin";
import { stripKnownSyntheticInterventions } from "@/core/config/syntheticInterventions";

export function parseCreatedAtMs(data: Record<string, unknown>): number {
  const raw = data.createdAt ?? data.statusUpdatedAt ?? data.scheduledDate;
  if (!raw) return 0;
  if (typeof raw === "object" && raw !== null && "seconds" in raw) {
    return (raw as { seconds: number }).seconds * 1000;
  }
  if (typeof raw === "string" || typeof raw === "number") {
    const t = Date.parse(String(raw));
    return Number.isFinite(t) ? t : 0;
  }
  return 0;
}

export function sortInterventionsByRecency(
  rows: Record<string, unknown>[]
): Record<string, unknown>[] {
  return [...rows].sort((a, b) => parseCreatedAtMs(b) - parseCreatedAtMs(a));
}

type CacheEntry = { rows: Record<string, unknown>[]; expiry: number };
const _interventionCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 45_000;

/**
 * Interventions société — sans orderBy Firestore (évite l'index composite manquant
 * companyId + createdAt). Tri en mémoire. Cache 45 s par session chatbot.
 */
export async function fetchInterventionsForCompany(
  firestore: admin.firestore.Firestore,
  companyId: string,
  limit = 100
): Promise<Record<string, unknown>[]> {
  const cacheKey = `${companyId}:${limit}`;
  const cached = _interventionCache.get(cacheKey);
  if (cached && Date.now() < cached.expiry) return cached.rows;

  const snap = await firestore
    .collection("interventions")
    .where("companyId", "==", companyId)
    .limit(Math.min(limit, 200))
    .get();

  const rows = sortInterventionsByRecency(
    stripKnownSyntheticInterventions(snap.docs.map((d) => ({ id: d.id, ...d.data() }))) as Record<
      string,
      unknown
    >[]
  );

  _interventionCache.set(cacheKey, { rows, expiry: Date.now() + CACHE_TTL_MS });
  return rows;
}

/** Invalide le cache pour une société (après une écriture chatbot). */
export function invalidateInterventionCache(companyId: string): void {
  for (const key of _interventionCache.keys()) {
    if (key.startsWith(`${companyId}:`)) _interventionCache.delete(key);
  }
}
