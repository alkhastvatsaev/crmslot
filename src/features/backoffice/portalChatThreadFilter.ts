import type { PortalChatDoc } from "@/features/backoffice/portalChatFirestore";
import {
  PORTAL_CHAT_GLOBAL_THREAD_ID,
  portalChatSenderUidFromThreadId,
} from "@/features/backoffice/portalChatInboxLogic";

/**
 * Filtre les messages visibles dans un fil de chat portail.
 *
 * - Staff sans fil / `global` : tous les messages société ou agrégé sans dossier.
 * - `__sender__:{uid}` : client anonyme sans dossier lié.
 * - Dossier : messages du dossier + réponses staff sans tag (legacy).
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
  if (senderUid) {
    return rows.filter((r) => {
      if (r.interventionId?.trim()) return false;
      return (r.senderUid ?? "").trim() === senderUid;
    });
  }

  return rows.filter((r) => {
    const msgIvId = r.interventionId?.trim() ?? "";
    if (!msgIvId) return r.role === "staff";
    return msgIvId === threadId;
  });
}
