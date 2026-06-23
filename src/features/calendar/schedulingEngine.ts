import { Intervention } from "@/features/interventions";

export interface TimeSlot {
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
}

export interface SchedulingConflict {
  hasConflict: boolean;
  conflictingInterventionId?: string;
  reason?: string;
}

/**
 * Moteur de scheduling intelligent.
 * Détecte les conflits de planning pour un technicien donné.
 * Par défaut, on assume qu'une intervention dure 60 minutes si non spécifié.
 */
export function checkSchedulingConflict(
  targetSlot: TimeSlot,
  targetTechnicianUid: string,
  existingInterventions: Intervention[],
  assumedDurationMinutes: number = 60
): SchedulingConflict {
  const targetDateStr = `${targetSlot.date}T${targetSlot.time}:00`;
  const targetStart = new Date(targetDateStr).getTime();
  const targetEnd = targetStart + assumedDurationMinutes * 60 * 1000;

  if (isNaN(targetStart)) {
    return { hasConflict: true, reason: "Format de date/heure invalide pour la cible." };
  }

  for (const iv of existingInterventions) {
    // Ignorer les interventions non assignées au technicien cible
    if (iv.assignedTechnicianUid !== targetTechnicianUid) continue;
    // Ignorer les interventions annulées ou terminées
    if (iv.status === "done" || iv.status === "invoiced" || iv.status === "cancelled") continue;
    // Ignorer les interventions non planifiées
    if (!iv.scheduledDate || !iv.scheduledTime) continue;

    const ivDateStr = `${iv.scheduledDate}T${iv.scheduledTime}:00`;
    const ivStart = new Date(ivDateStr).getTime();

    if (isNaN(ivStart)) continue;

    const ivEnd = ivStart + assumedDurationMinutes * 60 * 1000;

    // Logique d'overlap (chevauchement)
    // (StartA < EndB) and (EndA > StartB)
    const isOverlapping = targetStart < ivEnd && targetEnd > ivStart;

    if (isOverlapping) {
      return {
        hasConflict: true,
        conflictingInterventionId: iv.id,
        reason: `Conflit détecté avec l'intervention ${iv.id} prévue à ${iv.scheduledTime}.`,
      };
    }
  }

  return { hasConflict: false };
}
