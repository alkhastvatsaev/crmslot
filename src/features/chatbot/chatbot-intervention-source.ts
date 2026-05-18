import type * as admin from "firebase-admin";
import {
  DEMO_COMPANY_ID,
  devUiPreviewEnabled,
  realInterventionsOnly,
  stripKnownSyntheticInterventions,
} from "@/core/config/devUiPreview";
import { demoInterventionsForCompany } from "@/features/dev/demoInterventions";

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

export function sortInterventionsByRecency(rows: Record<string, unknown>[]): Record<string, unknown>[] {
  return [...rows].sort((a, b) => parseCreatedAtMs(b) - parseCreatedAtMs(a));
}

/** Données démo visibles dans le back-office mais absentes de Firestore. */
export function mergeDemoInterventionsForChatbot(
  companyId: string,
  firestoreRows: Record<string, unknown>[],
): Record<string, unknown>[] {
  const shouldMerge =
    devUiPreviewEnabled &&
    !realInterventionsOnly &&
    companyId.trim() === DEMO_COMPANY_ID;
  if (!shouldMerge) return firestoreRows;

  const byId = new Map<string, Record<string, unknown>>();
  for (const row of firestoreRows) byId.set(String(row.id), row);
  for (const iv of demoInterventionsForCompany(companyId)) {
    byId.set(iv.id, { ...iv } as Record<string, unknown>);
  }
  return sortInterventionsByRecency([...byId.values()]);
}

/**
 * Interventions société — sans orderBy Firestore (évite l'index composite manquant
 * companyId + createdAt). Tri en mémoire + fusion démo en dev.
 */
export async function fetchInterventionsForCompany(
  firestore: admin.firestore.Firestore,
  companyId: string,
  limit = 150,
): Promise<Record<string, unknown>[]> {
  const snap = await firestore
    .collection("interventions")
    .where("companyId", "==", companyId)
    .limit(Math.min(limit, 200))
    .get();

  const stripped = stripKnownSyntheticInterventions(
    snap.docs.map((d) => ({ id: d.id, ...d.data() })),
  ) as Record<string, unknown>[];

  const sorted = sortInterventionsByRecency(stripped);
  return mergeDemoInterventionsForChatbot(companyId, sorted);
}
