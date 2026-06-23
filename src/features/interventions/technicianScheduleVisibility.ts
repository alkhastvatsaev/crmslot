import type { Intervention } from "@/features/interventions/types";
import {
  isTechnicianActiveFieldMission,
  isTechnicianAssignmentAwaitingResponse,
  matchesAssignedTechnician,
} from "@/features/interventions/technicianAssignmentActions";
import type {
  InterventionScheduleFields,
  TechnicianTabFilter,
} from "@/features/interventions/technicianScheduleTypes";
import {
  coerceFirestoreLikeDate,
  endOfToday,
  endOfWeekSunday,
  getScheduleAnchor,
  getTechnicianMissionListSortAnchor,
  localCalendarYmd,
  startOfToday,
  startOfWeekMonday,
} from "@/features/interventions/technicianScheduleParse";

/**
 * Missions clôturées (`done` / `invoiced`) qui restent visibles dans la grille gauche
 * (texte vert) : planifiées pour l’onglet courant ou terminées le jour de référence.
 */
export function isTechnicianCompletedFieldMission(
  iv: Pick<Intervention, "status" | "assignedTechnicianUid" | "completedAt"> &
    InterventionScheduleFields,
  technicianUid: string | null | undefined,
  tab: TechnicianTabFilter,
  now = new Date()
): boolean {
  if (!matchesAssignedTechnician(iv, technicianUid)) return false;
  if (iv.status !== "done" && iv.status !== "invoiced") return false;
  if (interventionMatchesTab(iv, tab, now)) return true;
  if (tab !== "today") return false;
  const completedAt = coerceFirestoreLikeDate(iv.completedAt);
  if (!completedAt) return false;
  return completedAt >= startOfToday(now) && completedAt <= endOfToday(now);
}

/** Jour sélectionné dans le calendrier = jour civil courant (fuseau local). */
export function isCalendarAnchorToday(anchor: Date, realNow = new Date()): boolean {
  return localCalendarYmd(anchor) === localCalendarYmd(realNow);
}

/**
 * Liste missions technicien (panneau gauche) :
 * - assignations en attente + missions actives — visibles seulement quand le calendrier est sur **aujourd’hui** ;
 * - sinon filtre strict sur le jour sélectionné (planifiées / clôturées ce jour-là).
 */
export function interventionVisibleInTechnicianMissionList(
  iv: Intervention,
  tab: TechnicianTabFilter,
  technicianUid: string | null | undefined,
  selectedDay = new Date(),
  realNow = new Date()
): boolean {
  const viewingToday = isCalendarAnchorToday(selectedDay, realNow);
  if (viewingToday && isTechnicianAssignmentAwaitingResponse(iv, technicianUid)) return true;
  if (viewingToday && isTechnicianActiveFieldMission(iv, technicianUid)) return true;
  if (isTechnicianCompletedFieldMission(iv, technicianUid, tab, selectedDay)) return true;
  return interventionMatchesTab(iv, tab, selectedDay);
}

export function interventionMatchesTab(
  iv: InterventionScheduleFields,
  tab: TechnicianTabFilter,
  now = new Date()
): boolean {
  if (tab === "all") return true;
  const anchor = getScheduleAnchor(iv).getTime();
  if (anchor === 0) return false;
  const d = new Date(anchor);
  if (tab === "today") {
    return d >= startOfToday(now) && d <= endOfToday(now);
  }
  const ws = startOfWeekMonday(now);
  const we = endOfWeekSunday(now);
  return d >= ws && d <= we;
}

export function sortInterventionsByScheduleAsc(
  list: Intervention[],
  missionDayAnchor = new Date()
): Intervention[] {
  return [...list].sort((a, b) => {
    const delta =
      getTechnicianMissionListSortAnchor(a, missionDayAnchor).getTime() -
      getTechnicianMissionListSortAnchor(b, missionDayAnchor).getTime();
    if (delta !== 0) return delta;
    return a.id.localeCompare(b.id);
  });
}

/**
 * Dossier encore uniquement dans le file IVANA « Demandes » (soumission client),
 * avant validation / envoi terrain. {@link isInterventionReleasedToTechnicianField} est l’inverse.
 */
export function isPendingIntakeStatus(status: Intervention["status"]): boolean {
  return status === "pending" || status === "pending_needs_address";
}

export function isInterventionPendingBackOfficeIntake(iv: Pick<Intervention, "status">): boolean {
  return isPendingIntakeStatus(iv.status);
}

/** Assignée au technicien mais pas encore acceptée (refus possible ou bug acceptation). */
export function isInterventionAwaitingTechnicianAcceptance(
  iv: Pick<Intervention, "status" | "technicianAcceptedAt">
): boolean {
  if (iv.status === "assigned") return true;
  if (iv.status === "in_progress" && !(iv.technicianAcceptedAt ?? "").trim()) return true;
  return false;
}

/**
 * Onglet IVANA « Demandes » : nouvelles soumissions + dossiers revenus du terrain
 * (refus technicien ou acceptation jamais confirmée).
 */
export function isInterventionInBackofficeRequestsQueue(
  iv: Pick<Intervention, "status" | "technicianAcceptedAt">
): boolean {
  return (
    isInterventionPendingBackOfficeIntake(iv) || isInterventionAwaitingTechnicianAcceptance(iv)
  );
}

/** Visible sur le hub technicien (liste + offres) : après passage back-office (ex. statut ≠ pending). */
export function isInterventionReleasedToTechnicianField(iv: Intervention): boolean {
  return !isInterventionPendingBackOfficeIntake(iv);
}

/** Carte / missions live technicien : pas avant acceptation (statut `assigned` ou legacy sans `technicianAcceptedAt`). */
export function isInterventionVisibleOnTechnicianMap(
  iv: Pick<Intervention, "status" | "technicianAcceptedAt">
): boolean {
  if (isInterventionPendingBackOfficeIntake(iv)) return false;
  if (iv.status === "cancelled") return false;
  if (iv.status === "assigned") return false;
  if (iv.status === "in_progress" && !(iv.technicianAcceptedAt ?? "").trim()) return false;
  return true;
}

export function isInterventionActiveOnTechnicianHub(iv: Pick<Intervention, "status">): boolean {
  return iv.status !== "done" && iv.status !== "invoiced" && iv.status !== "cancelled";
}

/** Statuts terrain où un démarrage anticipé a du sens. */
export function isTechnicianEarlyStartPromptEligible(status: Intervention["status"]): boolean {
  return status === "assigned" || status === "en_route";
}
