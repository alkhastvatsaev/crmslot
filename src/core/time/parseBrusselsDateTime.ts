const BRUSSELS_TZ = "Europe/Brussels";

function getTimeZoneOffsetMs(utcMs: number, timeZone: string): number {
  const utcDate = new Date(utcMs);
  const inTz = new Date(utcDate.toLocaleString("en-US", { timeZone }));
  const inUtc = new Date(utcDate.toLocaleString("en-US", { timeZone: "UTC" }));
  return inTz.getTime() - inUtc.getTime();
}

/**
 * Interprète `YYYY-MM-DD` + `HH:mm` comme heure locale Europe/Brussels → instant UTC.
 */
export function parseBrusselsDateTime(dateYmd: string, timeHm: string): Date | null {
  const d = dateYmd.trim();
  const match = timeHm.trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d) || !match) return null;

  const year = Number(d.slice(0, 4));
  const month = Number(d.slice(5, 7));
  const day = Number(d.slice(8, 10));
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (
    !Number.isFinite(year) ||
    !Number.isFinite(month) ||
    !Number.isFinite(day) ||
    hour < 0 ||
    hour > 23 ||
    minute < 0 ||
    minute > 59
  ) {
    return null;
  }

  let utcMs = Date.UTC(year, month - 1, day, hour, minute, 0);
  for (let i = 0; i < 3; i++) {
    const offset = getTimeZoneOffsetMs(utcMs, BRUSSELS_TZ);
    const next = Date.UTC(year, month - 1, day, hour, minute, 0) - offset;
    if (next === utcMs) break;
    utcMs = next;
  }

  const parsed = new Date(utcMs);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}
