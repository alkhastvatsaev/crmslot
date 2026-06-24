import type { PortalChatDoc } from "@/features/backoffice/portalChatFirestore";
import {
  PORTAL_CHAT_GLOBAL_THREAD_ID,
  filterPortalChatMessagesForSenderUid,
  isPortalChatSenderThreadId,
  portalChatSenderUidFromThreadId,
} from "@/features/backoffice/portalChatInboxLogic";

export type PortalChatViewerFilter = {
  threadId?: string | null;
  publishAsPortal?: boolean;
  viewerUid?: string | null;
};

/**
 * Filtre les messages visibles dans un fil de chat portail.
 *
 * - Client portail : uniquement ses messages (+ staff liés), jamais toute la société.
 * - Staff `global` : messages sans dossier.
 * - Staff `__sender__:{uid}` : historique client + réponses staff.
 * - Staff dossier : messages taggés `interventionId`.
 */
export function filterPortalChatMessagesForThread(
  rows: PortalChatDoc[],
  threadInterventionId?: string | null
): PortalChatDoc[] {
  const threadId = (threadInterventionId ?? "").trim();
  if (!threadId) return rows;

  if (threadId === PORTAL_CHAT_GLOBAL_THREAD_ID) {
    return rows.filter((r) => !r.interventionId?.trim());
  }

  const senderUid = portalChatSenderUidFromThreadId(threadId);
  if (senderUid) return filterPortalChatMessagesForSenderUid(rows, senderUid);

  return rows.filter((r) => (r.interventionId?.trim() ?? "") === threadId);
}

/** Filtre lecture — sépare fil UI admin et vue client isolée. */
export function filterPortalChatMessagesForViewer(
  rows: PortalChatDoc[],
  { threadId, publishAsPortal, viewerUid }: PortalChatViewerFilter
): PortalChatDoc[] {
  const uid = (viewerUid ?? "").trim();
  const id = (threadId ?? "").trim();

  if (publishAsPortal && uid) {
    if (id && !isPortalChatSenderThreadId(id) && id !== PORTAL_CHAT_GLOBAL_THREAD_ID) {
      return rows.filter((r) => {
        const msgIv = r.interventionId?.trim() ?? "";
        if (!msgIv) return r.role === "staff";
        return msgIv === id;
      });
    }
    return filterPortalChatMessagesForSenderUid(rows, uid);
  }

  if (!id) return rows;
  return filterPortalChatMessagesForThread(rows, id);
}
