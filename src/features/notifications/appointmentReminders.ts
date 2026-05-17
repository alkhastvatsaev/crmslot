import type { Intervention } from "@/features/interventions/types";

// ---------------------------------------------------------------------------
// Appointment Reminder Engine
// ---------------------------------------------------------------------------
// Determines which interventions need reminder notifications based on
// their scheduled date/time and current time.

export interface ReminderCandidate {
  intervention: Pick<
    Intervention,
    | "id"
    | "status"
    | "clientName"
    | "clientFirstName"
    | "clientLastName"
    | "clientPhone"
    | "address"
    | "title"
    | "scheduledDate"
    | "scheduledTime"
    | "assignedTechnicianUid"
  >;
  /** Minutes until scheduled appointment. */
  minutesUntil: number;
  /** Type of reminder to send. */
  reminderType: "24h" | "2h" | "30min";
}

/** Windows in minutes before appointment when reminders should fire. */
const REMINDER_WINDOWS = [
  { type: "24h" as const, minBefore: 1440, tolerance: 30 },
  { type: "2h" as const, minBefore: 120, tolerance: 15 },
  { type: "30min" as const, minBefore: 30, tolerance: 10 },
];

/**
 * Parse scheduled date + time into a Date.
 * Returns null if either field is missing or invalid.
 */
function parseScheduledDateTime(
  scheduledDate?: string | null,
  scheduledTime?: string | null,
): Date | null {
  if (!scheduledDate || !scheduledTime) return null;
  const match = scheduledTime.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return null;
  const dt = new Date(`${scheduledDate}T${match[1]!.padStart(2, "0")}:${match[2]}:00`);
  return isNaN(dt.getTime()) ? null : dt;
}

/**
 * Given a list of active interventions, returns those that are due for a reminder.
 * Designed to be called periodically (e.g., every 5 minutes via a cron/Cloud Scheduler).
 */
export function findDueReminders(
  interventions: ReminderCandidate["intervention"][],
  now: Date = new Date(),
): ReminderCandidate[] {
  const results: ReminderCandidate[] = [];

  for (const iv of interventions) {
    // Only remind for assigned or en_route interventions
    if (iv.status !== "assigned" && iv.status !== "en_route") continue;

    const scheduledAt = parseScheduledDateTime(iv.scheduledDate, iv.scheduledTime);
    if (!scheduledAt) continue;

    const diffMs = scheduledAt.getTime() - now.getTime();
    const diffMin = diffMs / 60_000;

    // Skip past appointments
    if (diffMin < -5) continue;

    for (const window of REMINDER_WINDOWS) {
      if (
        diffMin <= window.minBefore + window.tolerance &&
        diffMin >= window.minBefore - window.tolerance
      ) {
        results.push({
          intervention: iv,
          minutesUntil: Math.round(diffMin),
          reminderType: window.type,
        });
        break; // Only one reminder per intervention per check
      }
    }
  }

  return results;
}

/**
 * Builds a human-readable reminder message.
 */
export function buildReminderMessage(candidate: ReminderCandidate): {
  subject: string;
  body: string;
} {
  const iv = candidate.intervention;
  const name =
    [iv.clientFirstName, iv.clientLastName].filter(Boolean).join(" ") ||
    iv.clientName ||
    "Client";

  const timeLabels: Record<string, string> = {
    "24h": "demain",
    "2h": "dans 2 heures",
    "30min": "dans 30 minutes",
  };

  const timeLabel = timeLabels[candidate.reminderType] || "bientôt";

  return {
    subject: `Rappel : intervention prévue ${timeLabel} — ${iv.title || "Intervention"}`,
    body: [
      `Bonjour ${name},`,
      ``,
      `Nous vous rappelons que votre intervention est prévue ${timeLabel}.`,
      ``,
      `📍 Adresse : ${iv.address || "Non précisée"}`,
      `📅 Date : ${iv.scheduledDate || "—"}`,
      `🕐 Heure : ${iv.scheduledTime || "—"}`,
      ``,
      `Merci de vous assurer que l'accès est possible.`,
      ``,
      `L'équipe MAP BELGIQUE`,
    ].join("\n"),
  };
}
