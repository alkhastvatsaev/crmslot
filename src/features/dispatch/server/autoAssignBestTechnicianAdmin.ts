import type * as admin from "firebase-admin";
import { applyBackofficeTechnicianAssignmentAdmin } from "@/features/backoffice/applyBackofficeTechnicianAssignmentAdmin";
import { loadTechniciansAdmin } from "@/features/dispatch/server/loadTechniciansAdmin";
import {
  prioritizeDefaultAssignTechnician,
  rankTechniciansForIntervention,
} from "@/features/dispatch/rankTechniciansForIntervention";
import {
  canResolveTechnicianAssignUid,
  resolveTechnicianAssignUid,
} from "@/features/dispatch/technicianAssignUid";
import { interventionLocationOrDefault } from "@/features/interventions/interventionLocation";
import type { Intervention } from "@/features/interventions";
import { canApplyBackofficeTechnicianAssignment } from "@/features/backoffice/applyBackofficeTechnicianAssignmentShared";

export type AutoAssignResult = {
  assigned: boolean;
  technicianUid?: string;
  technicianName?: string;
  distanceKm?: number;
  reason?: string;
};

/** Assigne automatiquement le technicien le plus proche (IA dispatch). */
export async function autoAssignBestTechnicianAdmin(params: {
  db: admin.firestore.Firestore;
  interventionId: string;
  iv: Intervention;
  actorUid: string;
}): Promise<AutoAssignResult> {
  const { db, interventionId, iv, actorUid } = params;

  if (!canApplyBackofficeTechnicianAssignment(iv)) {
    return { assigned: false, reason: "not_assignable" };
  }

  const loc = interventionLocationOrDefault(iv);
  const technicians = await loadTechniciansAdmin(db);
  const ranked = prioritizeDefaultAssignTechnician(
    rankTechniciansForIntervention(technicians, loc.lat, loc.lng)
  ).filter((row) => canResolveTechnicianAssignUid(row.technician));

  const best = ranked[0];
  if (!best) {
    return { assigned: false, reason: "no_technician" };
  }

  const technicianUid = resolveTechnicianAssignUid(best.technician);
  await applyBackofficeTechnicianAssignmentAdmin({
    db,
    interventionId,
    iv,
    technicianUid,
    actorUid,
  });

  return {
    assigned: true,
    technicianUid,
    technicianName: best.technician.name,
    distanceKm: Number.isFinite(best.distanceKm) ? best.distanceKm : undefined,
  };
}
