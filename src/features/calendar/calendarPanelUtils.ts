import { localDayKeyFromParts } from "@/features/calendar/calendarGrid";

export function weekdaysShortForLocale(locale: string): string[] {
  const base = new Date(Date.UTC(2026, 0, 6)); // Monday
  const fmt = new Intl.DateTimeFormat(locale, { weekday: "short" });
  const out: string[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(base);
    d.setUTCDate(base.getUTCDate() + i);
    out.push(fmt.format(d).replace(".", "").toLowerCase());
  }
  return out;
}

export function startOfWeekMonday(ref: Date): Date {
  const d = new Date(ref);
  const offset = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - offset);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function parseLocalDayKey(key: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(key.trim());
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]) - 1;
  const day = Number(m[3]);
  const d = new Date(y, mo, day);
  if (d.getFullYear() !== y || d.getMonth() !== mo || d.getDate() !== day) return null;
  return d;
}

export function calendarTodayKey(): string {
  const t = new Date();
  return localDayKeyFromParts(t.getFullYear(), t.getMonth(), t.getDate());
}
