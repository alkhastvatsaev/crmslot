import "@/core/config/firebase-admin";
import { getAdminDb } from "@/core/config/firebase-admin";
import {
  buildInterventionDraft,
  computeNextDueDate,
  findDueContracts,
} from "../generateDueInterventions";
import type { MaintenanceContract } from "../types";

export interface GenerateDueAdminResult {
  scanned: number;
  created: number;
}

/**
 * Job cron : lit tous les contrats actifs (`companies/{id}/maintenanceContracts`),
 * crée une intervention `pending` pour chaque contrat arrivé à échéance et
 * avance `nextDueDate` selon la fréquence.
 */
export async function generateDueInterventionsAdmin(
  now: Date = new Date()
): Promise<GenerateDueAdminResult> {
  const db = getAdminDb();
  const snap = await db.collectionGroup("maintenanceContracts").where("isActive", "==", true).get();

  const contracts: MaintenanceContract[] = snap.docs.map((d) => ({
    id: d.id,
    ...(d.data() as Omit<MaintenanceContract, "id">),
  }));

  const due = findDueContracts(contracts, now);
  if (due.length === 0) {
    return { scanned: contracts.length, created: 0 };
  }

  const batch = db.batch();
  const nowIso = now.toISOString();

  for (const contract of due) {
    const draft = buildInterventionDraft(contract);
    const interventionRef = db.collection("interventions").doc();
    batch.set(interventionRef, {
      ...draft,
      createdAt: nowIso,
      createdByUid: contract.createdByUid ?? null,
      source: "maintenance_contract",
    });

    const contractRef = db
      .collection("companies")
      .doc(contract.companyId)
      .collection("maintenanceContracts")
      .doc(contract.id);
    batch.update(contractRef, {
      nextDueDate: computeNextDueDate(contract),
      updatedAt: nowIso,
    });
  }

  await batch.commit();
  return { scanned: contracts.length, created: due.length };
}
