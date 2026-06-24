import type { PortalChatDoc, PortalChatRole } from "@/features/backoffice/portalChatFirestore";
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

/** Jamais persister `global`, `__sender__:` ou autres pseudo-fils dans Firestore. */
export function normalizePortalChatInterventionId(interventionId?: string | null): string | null {
  const id = (interventionId ?? "").trim();
  if (!id || id === PORTAL_CHAT_GLOBAL_THREAD_ID) return null;
  if (isPortalChatSenderThreadId(id)) return null;
  if (id.startsWith("__")) return null;
  return id;
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
    const iv = normalizePortalChatInterventionId(r.interventionId);
    if (iv) clientIvIds.add(iv);
  }

  const clientOnlyGlobal = clientIvIds.size === 0;

  return rows.filter((r) => {
    if (r.role === "client") return (r.senderUid ?? "").trim() === uid;
    const rawIv = r.interventionId?.trim();
    if (rawIv && isPortalChatSenderThreadId(rawIv)) {
      return portalChatSenderUidFromThreadId(rawIv) === uid;
    }
    const iv = normalizePortalChatInterventionId(r.interventionId);
    if (!iv) return clientOnlyGlobal;
    return clientIvIds.has(iv);
  });
}

/** Dernier dossier connu d’un client — pour tagger une réponse staff. */
export function latestClientInterventionIdForSender(
  rows: PortalChatDoc[],
  senderUid: string
): string | null {
  const uid = senderUid.trim();
  if (!uid) return null;
  let latest: PortalChatDoc | null = null;
  for (const r of rows) {
    if (r.role !== "client") continue;
    if ((r.senderUid ?? "").trim() !== uid) continue;
    const iv = normalizePortalChatInterventionId(r.interventionId);
    if (!iv) continue;
    if (!latest || portalChatMessageTimeMs(r) >= portalChatMessageTimeMs(latest)) latest = r;
  }
  return latest?.interventionId?.trim() || null;
}

/** Jamais écrire `__sender__:` ou `global` dans Firestore `interventionId`. */
export function resolvePortalChatWriteInterventionId(
  threadId: string | null | undefined,
  rows: PortalChatDoc[],
  role: PortalChatRole
): string | null {
  const id = (threadId ?? "").trim();
  if (!id || id === PORTAL_CHAT_GLOBAL_THREAD_ID) return null;
  if (isPortalChatSenderThreadId(id)) {
    if (role === "staff") {
      const senderUid = portalChatSenderUidFromThreadId(id);
      return senderUid ? latestClientInterventionIdForSender(rows, senderUid) : null;
    }
    return null;
  }
  if (id.startsWith("__")) return null;
  return id;
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
    const ivId = normalizePortalChatInterventionId(msg.interventionId);
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

  return sortChatDayRows(
    consolidateChatInboxPickerRows([...byThread.values()], messages),
    selectedDate
  );
}

function pickRicherChatDayRow(
  a: ChatDayMissionRow,
  b: ChatDayMissionRow,
  aRemappedFromIv: boolean,
  bRemappedFromIv: boolean
): { row: ChatDayMissionRow; remappedFromIv: boolean } {
  const score = (row: ChatDayMissionRow, remappedFromIv: boolean) =>
    (isPortalChatSenderThreadId(row.threadId) && !remappedFromIv ? 8 : 0) +
    (row.clientName.trim() ? 4 : 0) +
    (row.isToday ? 2 : 0) +
    (row.address?.trim() ? 1 : 0);
  const aScore = score(a, aRemappedFromIv);
  const bScore = score(b, bRemappedFromIv);
  const winner =
    bScore > aScore
      ? { primary: b, secondary: a, remapped: bRemappedFromIv }
      : { primary: a, secondary: b, remapped: aRemappedFromIv };
  return {
    remappedFromIv: winner.remapped,
    row: {
      ...winner.primary,
      address: winner.primary.address?.trim() ? winner.primary.address : winner.secondary.address,
      time: winner.primary.time?.trim() ? winner.primary.time : winner.secondary.time,
      isToday: winner.primary.isToday || winner.secondary.isToday,
      statusCode: winner.primary.statusCode ?? winner.secondary.statusCode,
    },
  };
}

/** Une ligne inbox par client — fusionne dossier + fil `__sender__:uid`. */
export function consolidateChatInboxPickerRows(
  rows: ChatDayMissionRow[],
  messages: PortalChatDoc[]
): ChatDayMissionRow[] {
  const ivToSender = new Map<string, string>();
  for (const m of messages) {
    if (m.role !== "client") continue;
    const uid = m.senderUid?.trim();
    if (!uid) continue;
    const iv = normalizePortalChatInterventionId(m.interventionId);
    if (iv) ivToSender.set(iv, uid);
  }

  const merged = new Map<string, { row: ChatDayMissionRow; remappedFromIv: boolean }>();
  for (const row of rows) {
    const mappedSender = ivToSender.get(row.threadId);
    const remappedFromIv = Boolean(mappedSender);
    const threadId = mappedSender
      ? `${PORTAL_CHAT_SENDER_THREAD_PREFIX}${mappedSender}`
      : row.threadId;
    const normalized = remappedFromIv ? { ...row, threadId } : row;
    const existing = merged.get(threadId);
    merged.set(
      threadId,
      existing
        ? pickRicherChatDayRow(existing.row, normalized, existing.remappedFromIv, remappedFromIv)
        : { row: normalized, remappedFromIv }
    );
  }
  return [...merged.values()].map((entry) => entry.row);
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
    const ivId = normalizePortalChatInterventionId(m.interventionId);
    if (ivId) ids.add(ivId);
  }
  return [...ids];
}

/** Messages d’un fil inbox (picker ou conversation). */
export function portalChatMessagesForThread(
  messages: PortalChatDoc[],
  threadId: string
): PortalChatDoc[] {
  const id = threadId.trim();
  if (id === PORTAL_CHAT_GLOBAL_THREAD_ID) {
    return messages.filter((m) => !normalizePortalChatInterventionId(m.interventionId));
  }
  const senderUid = portalChatSenderUidFromThreadId(id);
  if (senderUid) return filterPortalChatMessagesForSenderUid(messages, senderUid);
  return messages.filter((m) => normalizePortalChatInterventionId(m.interventionId) === id);
}

/** Fils dont le dernier message est du client — surbrillance liste inbox. */
export function portalChatThreadIdsNeedingReply(messages: PortalChatDoc[]): Set<string> {
  const candidates = new Set<string>();
  for (const m of messages) {
    if (m.role !== "client") continue;
    candidates.add(portalChatPickerThreadId(m));
  }

  const needing = new Set<string>();
  for (const threadId of candidates) {
    const sorted = [...portalChatMessagesForThread(messages, threadId)].sort(
      (a, b) => portalChatMessageTimeMs(a) - portalChatMessageTimeMs(b)
    );
    if (sorted[sorted.length - 1]?.role === "client") needing.add(threadId);
  }
  return needing;
}

/** Fils dont le dernier message est du client → badge inbox. */
export function countClientPortalThreadsNeedingReply(messages: PortalChatDoc[]): number {
  return portalChatThreadIdsNeedingReply(messages).size;
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
    const aReply = a.needsReply ? 0 : 1;
    const bReply = b.needsReply ? 0 : 1;
    if (aReply !== bReply) return aReply - bReply;
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
