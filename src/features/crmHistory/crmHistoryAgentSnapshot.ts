import type { CrmActivityEvent } from "@/features/crmHistory/crmActivityTypes";

export function buildCrmHistoryActivitySnapshot(events: CrmActivityEvent[]): string | null {
  if (!events.length) return null;
  try {
    return JSON.stringify({
      totalEvents: events.length,
      recent: events.slice(0, 30).map((e) => ({
        type: e.type,
        ts: e.ts,
        interventionId: e.interventionId ?? null,
        clientName: e.clientName ?? null,
        note: e.note ?? null,
      })),
    });
  } catch {
    return null;
  }
}
