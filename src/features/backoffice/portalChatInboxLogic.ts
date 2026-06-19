import type { IvanaPortalChatDoc } from "@/features/backoffice/ivanaChatFirestore";
import type { ChatDayMissionRow } from "@/features/backoffice/chatDayMissionRow";
import type { Intervention } from "@/features/interventions/types";
import {
  coerceFirestoreLikeDate,
  formatScheduledTimeOnly,
  interventionClientLabel,
  interventionMatchesTab,
} from "@/features/interventions/technicianSchedule";

export function portalChatThreadKey(interventionId?: string | null): string {
  const ivId = interventionId?.trim();
  return ivId || "__global__";
}

export function portalChatMessageTimeMs(msg: Pick<IvanaPortalChatDoc, "createdAt">): number {
  return coerceFirestoreLikeDate(msg.createdAt)?.getTime() ?? 0;
}

/** Dossiers ayant au moins un message client (toutes dates). */
export function interventionIdsWithClientPortalChat(messages: IvanaPortalChatDoc[]): string[] {
  const ids = new Set<string>();
  for (const m of messages) {
    if (m.role !== "client") continue;
    const ivId = m.interventionId?.trim();
    if (ivId) ids.add(ivId);
  }
  return [...ids];
}

/**
 * Fils dont le dernier message est du client → à traiter par le back-office.
 * Inclut le chat global et les dossiers hors « journée ».
 */
export function countClientPortalThreadsNeedingReply(messages: IvanaPortalChatDoc[]): number {
  const byThread = new Map<string, IvanaPortalChatDoc[]>();
  for (const m of messages) {
    const key = portalChatThreadKey(m.interventionId);
    const bucket = byThread.get(key) ?? [];
    bucket.push(m);
    byThread.set(key, bucket);
  }

  let count = 0;
  for (const thread of byThread.values()) {
    const sorted = [...thread].sort(
      (a, b) => portalChatMessageTimeMs(a) - portalChatMessageTimeMs(b)
    );
    const last = sorted[sorted.length - 1];
    if (last?.role === "client") count += 1;
  }
  return count;
}

export function filterNewClientPortalMessages(
  messages: IvanaPortalChatDoc[],
  seenIds: ReadonlySet<string>,
  staffUid: string | null | undefined
): IvanaPortalChatDoc[] {
  const uid = (staffUid ?? "").trim();
  return messages.filter(
    (m) => m.role === "client" && !seenIds.has(m.id) && (!uid || m.senderUid !== uid)
  );
}

export function sortChatDayRows(
  rows: ChatDayMissionRow[],
  _dayAnchor = new Date()
): ChatDayMissionRow[] {
  const timeScore = (row: ChatDayMissionRow): number => {
    const m = /^(\d{1,2}):(\d{2})/.exec((row.time ?? "").trim());
    if (!m) return 9999;
    return Number(m[1]) * 60 + Number(m[2]);
  };
  return [...rows].sort((a, b) => {
    const aToday = a.isToday ? 0 : 1;
    const bToday = b.isToday ? 0 : 1;
    if (aToday !== bToday) return aToday - bToday;
    if (a.isToday && b.isToday) {
      const delta = timeScore(a) - timeScore(b);
      if (delta !== 0) return delta;
    }
    const nameCmp = a.clientName.localeCompare(b.clientName, "fr");
    if (nameCmp !== 0) return nameCmp;
    return a.threadId.localeCompare(b.threadId);
  });
}

export function chatDayRowFromIntervention(
  iv: Intervention,
  selectedDate = new Date()
): ChatDayMissionRow {
  return {
    threadId: iv.id,
    clientName:
      interventionClientLabel(iv) || iv.clientCompanyName?.trim() || iv.clientName?.trim() || "",
    time: formatScheduledTimeOnly(iv),
    address: iv.address,
    statusCode: iv.status,
    isToday: interventionMatchesTab(iv, "today", selectedDate),
  };
}

export function showPortalChatBrowserNotification(title: string, body: string, tag: string): void {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (Notification.permission !== "granted") return;
  try {
    // eslint-disable-next-line no-new
    new Notification(title, { body, tag });
  } catch {
    /* ignore */
  }
}
