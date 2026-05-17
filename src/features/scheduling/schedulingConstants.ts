/** Créneaux horaires proposés (Europe/Brussels, heure locale). */
export const SCHEDULING_WORK_SLOTS = [
  "08:00",
  "09:00",
  "10:00",
  "11:00",
  "12:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
  "18:00",
] as const;

export const SCHEDULING_DEFAULT_DURATION_MS = 60 * 60 * 1000;

/** Statuts qui occupent l’agenda d’un technicien assigné. */
export const SCHEDULING_BLOCKING_STATUSES = [
  "assigned",
  "en_route",
  "in_progress",
  "waiting_material",
] as const;
