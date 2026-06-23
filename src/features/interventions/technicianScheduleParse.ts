import type { Intervention } from "@/features/interventions/types";
import type { InterventionScheduleFields } from "@/features/interventions/technicianScheduleTypes";

/** Parse Firestore Timestamp, chaîne ISO, nombre (ms) ou Date pour tri / filtres. */
export function coerceFirestoreLikeDate(value: unknown): Date | null {
  if (value == null) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  if (typeof value === "string" || typeof value === "number") {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  if (typeof value === "object") {
    const v = value as { toDate?: () => Date; seconds?: number; _seconds?: number };
    if (typeof v.toDate === "function") {
      const d = v.toDate();
      return Number.isNaN(d.getTime()) ? null : d;
    }
    const sec =
      typeof v.seconds === "number"
        ? v.seconds
        : typeof v._seconds === "number"
          ? v._seconds
          : undefined;
    if (sec !== undefined) {
      const d = new Date(sec * 1000);
      return Number.isNaN(d.getTime()) ? null : d;
    }
  }
  return null;
}

/** Valeur Firestore / formulaire → texte affichable (évite crash `.trim()` sur number, Timestamp…). */
export function coerceDisplayString(value: unknown): string | null {
  if (value == null) return null;
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed || null;
  }
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  if (typeof value === "boolean") return value ? "✓" : null;
  const d = coerceFirestoreLikeDate(value);
  if (d) {
    return d.toLocaleString("fr-BE", { dateStyle: "short", timeStyle: "short" });
  }
  return null;
}

export function normalizeTimeHm(input: string | null | undefined): string | null {
  if (!input?.trim()) return null;
  const m = /^(\d{1,2}):(\d{2})/.exec(input.trim());
  if (!m) return null;
  const hh = Number(m[1]);
  const mm = Number(m[2]);
  if (hh > 23 || mm > 59) return null;
  return `${String(hh).padStart(2, "0")}:${m[2]}`;
}

/** AAAA-MM-JJ dans le fuseau local (aligné calendrier hub technicien). */
export function localCalendarYmd(ref: Date): string {
  const y = ref.getFullYear();
  const m = String(ref.getMonth() + 1).padStart(2, "0");
  const d = String(ref.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** HH:mm dans le fuseau local. */
export function localCalendarHm(ref: Date): string {
  const hh = String(ref.getHours()).padStart(2, "0");
  const mm = String(ref.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

export function startOfToday(ref: Date): Date {
  const n = new Date(ref);
  n.setHours(0, 0, 0, 0);
  return n;
}

export function endOfToday(ref: Date): Date {
  const n = new Date(ref);
  n.setHours(23, 59, 59, 999);
  return n;
}

/** Semaine calendaire lundi → dimanche (locale). */
export function startOfWeekMonday(ref: Date): Date {
  const x = new Date(ref);
  const dow = x.getDay();
  const offsetFromMonday = (dow + 6) % 7;
  x.setDate(x.getDate() - offsetFromMonday);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function endOfWeekSunday(ref: Date): Date {
  const s = startOfWeekMonday(ref);
  const e = new Date(s);
  e.setDate(e.getDate() + 6);
  e.setHours(23, 59, 59, 999);
  return e;
}

/**
 * Ancrage à partir des champs historiques `date` (AAAA-MM-JJ) + `hour` ou `time`
 * (ex. flux audio / carte) — avant `createdAt`, pour aligner carte et hub technicien.
 */
export function anchorFromLegacyDateHour(iv: InterventionScheduleFields): Date | null {
  const dateStr = (iv.date ?? "").trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return null;
  const hourRaw = (iv.hour ?? "").trim() || (iv.time ?? "").trim();
  if (!hourRaw || /^maintenant$/i.test(hourRaw)) {
    const d = new Date(`${dateStr}T12:00:00`);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  const m = /^(\d{1,2}):(\d{2})(?::\d{2})?$/.exec(hourRaw);
  if (m) {
    const hh = m[1].padStart(2, "0");
    const mm = m[2];
    const d = new Date(`${dateStr}T${hh}:${mm}:00`);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  const d = new Date(`${dateStr}T12:00:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Ancrage temporel pour filtres & tri (Europe/Brussels via Date locale du navigateur). */
export function getScheduleAnchor(iv: InterventionScheduleFields): Date {
  if (iv.scheduledDate && iv.scheduledTime) {
    const iso = `${iv.scheduledDate}T${iv.scheduledTime}:00`;
    const d = new Date(iso);
    if (!Number.isNaN(d.getTime())) return d;
  }
  if (iv.requestedDate && iv.requestedTime) {
    const iso = `${iv.requestedDate}T${iv.requestedTime}:00`;
    const d = new Date(iso);
    if (!Number.isNaN(d.getTime())) return d;
  }
  if (iv.requestedDate) {
    const iso = `${iv.requestedDate}T12:00:00`;
    const d = new Date(iso);
    if (!Number.isNaN(d.getTime())) return d;
  }
  const legacy = anchorFromLegacyDateHour(iv);
  if (legacy) return legacy;
  const fromCreated = coerceFirestoreLikeDate(iv.createdAt);
  if (fromCreated) return fromCreated;
  return new Date(0);
}

/** Mission encore active mais planifiée avant le jour affiché → tête de journée. */
export function clampOverdueActiveMissionToDay(
  anchor: Date,
  iv: Pick<Intervention, "status">,
  missionDayAnchor: Date
): Date {
  if (anchor.getTime() >= startOfToday(missionDayAnchor).getTime()) return anchor;
  if (
    iv.status === "assigned" ||
    iv.status === "en_route" ||
    iv.status === "in_progress" ||
    iv.status === "waiting_material"
  ) {
    return startOfToday(missionDayAnchor);
  }
  return anchor;
}

/**
 * Heure HH:mm affichée sur la tuile mission (alignée {@link formatScheduledTimeOnly}).
 */
export function missionDisplayTimeHm(iv: InterventionScheduleFields): string | null {
  return (
    normalizeTimeHm(iv.scheduledTime) ??
    normalizeTimeHm(iv.requestedTime) ??
    normalizeTimeHm(iv.hour) ??
    normalizeTimeHm(iv.time)
  );
}

/**
 * Clé de tri liste / grille missions technicien — alignée sur l’heure affichée
 * ({@link formatScheduledTimeOnly}) et le jour sélectionné dans le calendrier.
 */
export function getTechnicianMissionListSortAnchor(
  iv: InterventionScheduleFields & Pick<Intervention, "status" | "completedAt" | "urgency">,
  missionDayAnchor = new Date()
): Date {
  const dayYmd = localCalendarYmd(missionDayAnchor);

  const displayTime = missionDisplayTimeHm(iv);
  if (displayTime) {
    const onViewedDay = new Date(`${dayYmd}T${displayTime}:00`);
    if (!Number.isNaN(onViewedDay.getTime())) return onViewedDay;
  }

  const full = getScheduleAnchor(iv);
  if (full.getTime() !== 0) {
    if (localCalendarYmd(full) === dayYmd) {
      return clampOverdueActiveMissionToDay(full, iv, missionDayAnchor);
    }
    if (iv.status === "done" || iv.status === "invoiced") {
      const completedAt = coerceFirestoreLikeDate(iv.completedAt);
      if (completedAt && localCalendarYmd(completedAt) === dayYmd) {
        return completedAt;
      }
      return endOfToday(missionDayAnchor);
    }
    return clampOverdueActiveMissionToDay(full, iv, missionDayAnchor);
  }

  if (iv.status === "done" || iv.status === "invoiced") {
    const completedAt = coerceFirestoreLikeDate(iv.completedAt);
    if (completedAt) return completedAt;
  }

  if (iv.urgency) {
    const d = new Date(`${dayYmd}T00:00:00`);
    if (!Number.isNaN(d.getTime())) return d;
  }

  return new Date(0);
}

/**
 * Lorsque le back-office confirme / envoie au technicien : figer une planification lisible par
 * {@link getScheduleAnchor} pour le filtre « jour » du hub (évite de rester sur
 * `createdAt` = jour de soumission si la validation a lieu plus tard).
 */
export function scheduledFieldsWhenReleasingToTechnician(
  iv: Pick<Intervention, "requestedDate" | "requestedTime" | "scheduledDate" | "scheduledTime">,
  now = new Date()
): { scheduledDate: string; scheduledTime: string } {
  const schD = iv.scheduledDate?.trim();
  const schT = normalizeTimeHm(iv.scheduledTime);
  if (schD && /^\d{4}-\d{2}-\d{2}$/.test(schD)) {
    return { scheduledDate: schD, scheduledTime: schT ?? "12:00" };
  }
  const reqD = iv.requestedDate?.trim();
  const reqT = normalizeTimeHm(iv.requestedTime);
  if (reqD && /^\d{4}-\d{2}-\d{2}$/.test(reqD)) {
    return { scheduledDate: reqD, scheduledTime: reqT ?? "12:00" };
  }
  return {
    scheduledDate: localCalendarYmd(now),
    scheduledTime: localCalendarHm(now),
  };
}

/** Créneau planifié explicite (sans repli sur `createdAt`). */
export function getInterventionExplicitScheduledStart(iv: InterventionScheduleFields): Date | null {
  const schD = iv.scheduledDate?.trim();
  const schT = normalizeTimeHm(iv.scheduledTime);
  if (schD && /^\d{4}-\d{2}-\d{2}$/.test(schD)) {
    const d = new Date(`${schD}T${schT ?? "00:00"}:00`);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  const reqD = iv.requestedDate?.trim();
  const reqT = normalizeTimeHm(iv.requestedTime);
  if (reqD && /^\d{4}-\d{2}-\d{2}$/.test(reqD)) {
    const d = new Date(`${reqD}T${reqT ?? "00:00"}:00`);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  const legacy = anchorFromLegacyDateHour(iv);
  if (legacy && ((iv.date ?? "").trim() || (iv.hour ?? "").trim() || (iv.time ?? "").trim())) {
    return legacy;
  }
  return null;
}

/** Vrai tant que l’heure / le jour planifié n’est pas encore atteint. */
export function isInterventionBeforeScheduledSlot(
  iv: InterventionScheduleFields,
  now = new Date()
): boolean {
  const start = getInterventionExplicitScheduledStart(iv);
  if (!start) return false;
  return now.getTime() < start.getTime();
}
