import type { Intervention } from "@/features/interventions";

export interface CalendarDay {
  date: string; // "YYYY-MM-DD"
  interventions: Intervention[];
}

/** Returns the 7 days of the ISO week containing the given date. */
export function getWeekDays(date: Date): Date[] {
  const d = new Date(date);
  const day = d.getDay();
  const monday = new Date(d);
  monday.setDate(d.getDate() - ((day + 6) % 7));
  return Array.from({ length: 7 }, (_, i) => {
    const dd = new Date(monday);
    dd.setDate(monday.getDate() + i);
    return dd;
  });
}

export function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** Groups interventions by their scheduledDate into a week view. */
export function buildWeekCalendar(
  interventions: Intervention[],
  weekContaining: Date
): CalendarDay[] {
  const days = getWeekDays(weekContaining);
  return days.map((d) => {
    const iso = toIsoDate(d);
    return {
      date: iso,
      interventions: interventions.filter((iv) => iv.scheduledDate === iso),
    };
  });
}

export const WEEKDAY_LABELS_FR = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
