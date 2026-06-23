import type { Intervention } from "@/features/interventions/types";
import type {
  DailyMissionCardTone,
  InterventionScheduleFields,
} from "@/features/interventions/technicianScheduleTypes";
import {
  getScheduleAnchor,
  normalizeTimeHm,
} from "@/features/interventions/technicianScheduleParse";

export function formatScheduledLabel(iv: Intervention): string {
  const anchor = getScheduleAnchor(iv);
  if (anchor.getTime() === 0) {
    return iv.time?.trim() ? iv.time : "—";
  }
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
