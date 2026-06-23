import type { Intervention } from "@/features/interventions/types";

export type TechnicianTabFilter = "today" | "week" | "all";

/** Champs utilisés par {@link getScheduleAnchor} et les filtres d’onglet technicien. */
export type InterventionScheduleFields = Pick<
  Intervention,
  | "scheduledDate"
  | "scheduledTime"
  | "requestedDate"
  | "requestedTime"
  | "date"
  | "hour"
  | "time"
  | "createdAt"
>;

/** Teinte visuelle des tuiles « missions du jour » (ombres / dégradés). */
export type DailyMissionCardTone = "done" | "active" | "upcoming";
