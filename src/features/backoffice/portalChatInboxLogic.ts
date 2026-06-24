import type { PortalChatDoc } from "@/features/backoffice/portalChatFirestore";
import type { ChatDayMissionRow } from "@/features/backoffice/chatDayMissionRow";
import type { Intervention } from "@/features/interventions";
import {
  coerceFirestoreLikeDate,
  formatScheduledTimeOnly,
  interventionClientLabel,
  interventionMatchesTab,
} from "@/features/interventions/technicianSchedule";

/** Fil global legacy (tous les messages sans dossier). */
export const PORTAL_CHAT_GLOBAL_THREAD_ID = "global";
export const PORTAL_CHAT_SENDER_THREAD_PREFIX = "__sender__:";

/** Inbox admin : un fil par client (`senderUid`), tous dossiers confondus. */
export function portalChatPickerThreadId(
  msg: Pick<PortalChatDoc, "interventionId" | "senderUid" | "role">
): string {
  if (msg.role !== "client") return PORTAL_CHAT_GLOBAL_THREAD_ID;
  const uid = msg.senderUid?.trim();
  if (uid) return `${PORTAL_CHAT_SENDER_THREAD_PREFIX}${uid}`;
  return PORTAL_CHAT_GLOBAL_THREAD_ID;
}

export function isPortalChatSenderThreadId(threadId: string): boolean {
  return threadId.startsWith(PORTAL_CHAT_SENDER_THREAD_PREFIX);
}

export function portalChatSenderUidFromThreadId(threadId: string): string | null {
  if (!isPortalChatSenderThreadId(threadId)) return null;
  const uid = threadId.slice(PORTAL_CHAT_SENDER_THREAD_PREFIX.length).trim();
  return uid || null;
}

/** Historique complet d’un client portail (messages + réponses staff sur ses dossiers). */
export function filterPortalChatMessagesForSenderUid(
  rows: PortalChatDoc[],
  senderUid: string
): PortalChatDoc[] {
  const uid = senderUid.trim();
  if (!uid) return [];

  const clientIvIds = new Set<string>();
  for (const r of rows) {
    if (r.role !== "client") continue;
    if ((r.senderUid ?? "").trim() !== uid) continue;
    const iv = r.interventionId?.trim();
    if (iv) clientIvIds.add(iv);
  }

  const clientOnlyGlobal = clientIvIds.size === 0;

  return rows.filter((r) => {
    const iv = r.interventionId?.trim();
    if (r.role === "client") return (r.senderUid ?? "").trim() === uid;
    if (!iv) return clientOnlyGlobal;
    return clientIvIds.has(iv);
  });
}

export type EnrichChatDayRowsOptions = {
  interventions?: Intervention[];
  selectedDate?: Date;
};

/** Une ligne par client portail — nom + adresse du dernier dossier connu. */
export function enrichChatDayRowsFromPortalMessages(
  rows: ChatDayMissionRow[],
  messages: PortalChatDoc[],
  options: EnrichChatDayRowsOptions = {}
): ChatDayMissionRow[] {
  const { interventions = [], selectedDate = new Date() } = options;
  const byThread = new Map(rows.map((r) => [r.threadId, r]));
  const latestClientByThread = new Map<string, PortalChatDoc>();

  for (const m of messages) {
    if (m.role !== "client") continue;
    const threadId = portalChatPickerThreadId(m);
    const prev = latestClientByThread.get(threadId);
    if (!prev || portalChatMessageTimeMs(m) >= portalChatMessageTimeMs(prev)) {
      latestClientByThread.set(threadId, m);
    }
  }

  for (const [threadId, msg] of latestClientByThread) {
    if (threadId === PORTAL_CHAT_GLOBAL_THREAD_ID) continue;
    const senderName = msg.senderName?.trim() ?? "";
    const ivId = msg.interventionId?.trim();
    const iv = ivId ? interventions.find((x) => x.id === ivId) : undefined;
    const existing = byThread.get(threadId);
    if (existing) {
      if (!existing.clientName.trim() && senderName) {
        byThread.set(threadId, {
          ...existing,
          clientName: senderName,
          ...(iv && !existing.address ? { address: iv.address } : {}),
        });
      }
      continue;
    }
    byThread.set(threadId, {
      threadId,
      clientName: senderName,
      time: iv ? formatScheduledTimeOnly(iv) : "",
      address: iv?.address,
      statusCode: iv?.status,
      isToday: iv ? interventionMatchesTab(iv, "today", selectedDate) : false,
    });
  }

  return sortChatDayRows([...byThread.values()], selectedDate);
}

export function portalChatThreadKey(interventionId?: string | null): string {
  const ivId = interventionId?.trim();
  return ivId || "__global__";
}

export function portalChatMessageTimeMs(msg: Pick<PortalChatDoc, "createdAt">): number {
  return coerceFirestoreLikeDate(msg.createdAt)?.getTime() ?? 0;
}

/** Dossiers ayant au moins un message client (toutes dates). */
export function interventionIdsWithClientPortalChat(messages: PortalChatDoc[]): string[] {
  const ids = new Set<string>();
  for (const m of messages) {
    if (m.role !== "client") continue;
    const ivId = m.interventionId?.trim();
    if (ivId) ids.add(ivId);
  }
  return [...ids];
}

/** Fils dont le dernier message est du client → badge inbox. */
export function countClientPortalThreadsNeedingReply(messages: PortalChatDoc[]): number {
  const threadIds = new Set<string>();
  for (const m of messages) {
    if (m.role !== "client") continue;
    threadIds.add(portalChatPickerThreadId(m));
  }

  let count = 0;
  for (const threadId of threadIds) {
    if (threadId === PORTAL_CHAT_GLOBAL_THREAD_ID) continue;
    const senderUid = portalChatSenderUidFromThreadId(threadId);
    const threadMessages = senderUid
      ? filterPortalChatMessagesForSenderUid(messages, senderUid)
      : messages.filter((m) => !m.interventionId?.trim());
    const sorted = [...threadMessages].sort(
      (a, b) => portalChatMessageTimeMs(a) - portalChatMessageTimeMs(b)
    );
    const last = sorted[sorted.length - 1];
    if (last?.role === "client") count += 1;
  }
  return count;
}

export function filterNewClientPortalMessages(
  messages: PortalChatDoc[],
  seenIds: ReadonlySet<string>,
  staffUid: string | null | undefined
): PortalChatDoc[] {
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
