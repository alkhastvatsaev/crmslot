/**
 * Helpers de scheduling pinés sur Europe/Brussels — pour le code serveur (Node)
 * où le fuseau runtime peut être UTC.
 */

const BRUSSELS_TZ = "Europe/Brussels";

/** AAAA-MM-JJ dans le fuseau Europe/Brussels. */
export function brusselsCalendarYmd(ref: Date): string {
  const parts = new Intl.DateTimeFormat("sv-SE", {
    timeZone: BRUSSELS_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(ref);
  const y = parts.find((p) => p.type === "year")!.value;
  const m = parts.find((p) => p.type === "month")!.value;
  const d = parts.find((p) => p.type === "day")!.value;
  return `${y}-${m}-${d}`;
}

/** HH:mm dans le fuseau Europe/Brussels. */
export function brusselsCalendarHm(ref: Date): string {
  const parts = new Intl.DateTimeFormat("sv-SE", {
    timeZone: BRUSSELS_TZ,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(ref);
  const hh = parts.find((p) => p.type === "hour")!.value;
  const mm = parts.find((p) => p.type === "minute")!.value;
  return `${hh}:${mm}`;
}

/**
 * Interprète `YYYY-MM-DD` + `HH:mm` comme heure locale Europe/Brussels → ms epoch.
 * Compatible serveur UTC et navigateur CET/CEST.
 */
export function parseBrusselsSlotMs(dateYmd: string, timeHm: string): number | null {
  const dateMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateYmd.trim());
  const timeMatch = /^(\d{1,2}):(\d{2})$/.exec(timeHm.trim());
  if (!dateMatch || !timeMatch) return null;

  const year = Number(dateMatch[1]);
  const month = Number(dateMatch[2]);
  const day = Number(dateMatch[3]);
  const hour = Number(timeMatch[1]);
  const minute = Number(timeMatch[2]);

  if (hour > 23 || minute > 59) return null;

  let utcMs = Date.UTC(year, month - 1, day, hour, minute, 0);
  for (let i = 0; i < 3; i++) {
    const inTz = new Date(new Date(utcMs).toLocaleString("en-US", { timeZone: BRUSSELS_TZ }));
    const inUtc = new Date(new Date(utcMs).toLocaleString("en-US", { timeZone: "UTC" }));
    const offset = inTz.getTime() - inUtc.getTime();
    const next = Date.UTC(year, month - 1, day, hour, minute, 0) - offset;
    if (next === utcMs) break;
    utcMs = next;
  }

  return Number.isNaN(utcMs) ? null : utcMs;
}
