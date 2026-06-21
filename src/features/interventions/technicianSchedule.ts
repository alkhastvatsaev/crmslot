import type { Intervention } from "@/features/interventions/types";
import {
  isTechnicianActiveFieldMission,
  isTechnicianAssignmentAwaitingResponse,
  matchesAssignedTechnician,
} from "@/features/interventions/technicianAssignmentActions";

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

/**
 * Ancrage à partir des champs historiques `date` (AAAA-MM-JJ) + `hour` ou `time`
 * (ex. flux audio / carte) — avant `createdAt`, pour aligner carte et hub technicien.
 */
function anchorFromLegacyDateHour(iv: InterventionScheduleFields): Date | null {
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

function startOfToday(ref: Date): Date {
  const n = new Date(ref);
  n.setHours(0, 0, 0, 0);
  return n;
}

function endOfToday(ref: Date): Date {
  const n = new Date(ref);
  n.setHours(23, 59, 59, 999);
  return n;
}

/** Semaine calendaire lundi → dimanche (locale). */
function startOfWeekMonday(ref: Date): Date {
  const x = new Date(ref);
  const dow = x.getDay();
  const offsetFromMonday = (dow + 6) % 7;
  x.setDate(x.getDate() - offsetFromMonday);
  x.setHours(0, 0, 0, 0);
  return x;
}

function endOfWeekSunday(ref: Date): Date {
  const s = startOfWeekMonday(ref);
  const e = new Date(s);
  e.setDate(e.getDate() + 6);
  e.setHours(23, 59, 59, 999);
  return e;
}

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

/** Mission encore active mais planifiée avant le jour affiché → tête de journée. */
function clampOverdueActiveMissionToDay(
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

function normalizeTimeHm(input: string | null | undefined): string | null {
  if (!input?.trim()) return null;
  const m = /^(\d{1,2}):(\d{2})/.exec(input.trim());
  if (!m) return null;
  const hh = Number(m[1]);
  const mm = Number(m[2]);
  if (hh > 23 || mm > 59) return null;
  return `${String(hh).padStart(2, "0")}:${m[2]}`;
}

/**
 * Lorsqu’IVANA confirme / envoie au technicien : figer une planification lisible par
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

export function formatScheduledLabel(iv: Intervention): string {
  const anchor = getScheduleAnchor(iv);
  if (anchor.getTime() === 0) {
    return iv.time?.trim() ? iv.time : "—";
  }
  // Locale is applied at the call site when needed; default browser locale here.
  return anchor.toLocaleString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatScheduledTimeOnly(iv: Intervention): string {
  if (iv.scheduledTime) return iv.scheduledTime;
  if (iv.requestedTime) return iv.requestedTime;
  if (iv.hour && iv.hour.trim() !== "") return iv.hour;
  if (iv.time && iv.time.trim() !== "") return iv.time;

  if (iv.urgency) return "common.urgent";

  return "common.dash";
}

export function mapI18nLanguageToLocale(language: "fr" | "en" | "nl" | "ru"): string {
  if (language === "en") return "en-GB";
  if (language === "nl") return "nl-BE";
  if (language === "ru") return "ru-RU";
  return "fr-BE";
}

function capitalizeWord(value: string): string {
  if (!value) return value;
  return value.charAt(0).toLocaleUpperCase("fr-BE") + value.slice(1);
}

function formatPortalAppointmentTime(d: Date, locale: string): string {
  const hours = d.getHours();
  const minutes = d.getMinutes();
  const hhmm = `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;

  if (locale.startsWith("fr") || locale.startsWith("nl")) {
    return hhmm;
  }
  return d.toLocaleTimeString(locale, {
    hour: "numeric",
    minute: minutes === 0 ? undefined : "2-digit",
  });
}

/** Rendez-vous portail client — ex. « Lundi 6 juin à 10 heures » (pas AAAA-MM-JJ). */
export function formatPortalAppointmentLabel(
  dateStr: string | null | undefined,
  timeStr: string | null | undefined,
  locale = "fr-BE"
): string | null {
  const date = dateStr?.trim();
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;

  const normalizedTime = normalizeTimeHm(timeStr);
  const anchor = normalizedTime
    ? new Date(`${date}T${normalizedTime}:00`)
    : new Date(`${date}T12:00:00`);
  if (Number.isNaN(anchor.getTime())) return null;

  const weekday = capitalizeWord(anchor.toLocaleDateString(locale, { weekday: "long" }));
  const day = anchor.getDate();
  const month = capitalizeWord(anchor.toLocaleDateString(locale, { month: "long" }));

  if (locale.startsWith("fr")) {
    return normalizedTime
      ? `${weekday} ${day} ${month} à ${formatPortalAppointmentTime(anchor, locale)}`
      : `${weekday} ${day} ${month}`;
  }
  if (locale.startsWith("nl")) {
    return normalizedTime
      ? `${weekday} ${day} ${month} om ${formatPortalAppointmentTime(anchor, locale)}`
      : `${weekday} ${day} ${month}`;
  }
  return normalizedTime
    ? `${weekday}, ${day} ${month} at ${formatPortalAppointmentTime(anchor, locale)}`
    : `${weekday}, ${day} ${month}`;
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

/** Statuts terrain où un démarrage anticipé a du sens. */
export function isTechnicianEarlyStartPromptEligible(status: Intervention["status"]): boolean {
  return status === "assigned" || status === "en_route";
}

/** Libellé rendez-vous pour le bandeau « démarrage anticipé ». */
export function formatTechnicianScheduledAppointmentLabel(
  iv: InterventionScheduleFields,
  locale = "fr-BE"
): string | null {
  const schD = iv.scheduledDate?.trim();
  if (schD) {
    return formatPortalAppointmentLabel(schD, iv.scheduledTime, locale);
  }
  const reqD = iv.requestedDate?.trim();
  if (reqD) {
    return formatPortalAppointmentLabel(reqD, iv.requestedTime, locale);
  }
  const legacyDate = iv.date?.trim();
  if (legacyDate) {
    return formatPortalAppointmentLabel(legacyDate, iv.hour ?? iv.time, locale);
  }
  return null;
}

export function interventionClientLabel(iv: Intervention): string {
  const first = iv.clientFirstName?.trim();
  const last = iv.clientLastName?.trim();
  if (first || last) {
    return [first, last].filter(Boolean).join(" ");
  }
  const n = iv.clientName?.trim();
  if (n) return n;
  const t = iv.title?.trim();
  if (t) return t;
  return "";
}

export function statusLabelKey(status: Intervention["status"]): string {
  switch (status) {
    case "pending":
      return "status.pending";
    case "assigned":
      return "status.assigned";
    case "en_route":
      return "status.en_route";
    case "pending_needs_address":
      return "status.pending_needs_address";
    case "in_progress":
      return "status.in_progress";
    case "done":
      return "status.done";
    case "invoiced":
      return "status.invoiced";
    case "waiting_material":
      return "status.waiting_material";
    case "cancelled":
      return "status.cancelled";
    default:
      return String(status);
  }
}

/** Teinte visuelle des tuiles « missions du jour » (ombres / dégradés). */
export type DailyMissionCardTone = "done" | "active" | "upcoming";

/**
 * Associe le libellé affiché sur une mission (voir {@link statusLabelFr}, ou mock `À venir` / `Terminé` / …)
 * à la même logique couleur que les missions générées.
 */
export function dailyMissionCardToneFromStatus(
  status: Intervention["status"] | null | undefined
): DailyMissionCardTone {
  if (!status) return "upcoming";
  if (status === "done" || status === "invoiced" || status === "cancelled") return "done";
  if (
    status === "assigned" ||
    status === "en_route" ||
    status === "in_progress" ||
    status === "waiting_material"
  ) {
    return "active";
  }
  return "upcoming";
}
