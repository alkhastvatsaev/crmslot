import type { PortalChatDoc } from "@/features/backoffice/portalChatFirestore";
import {
  PORTAL_CHAT_GLOBAL_THREAD_ID,
  filterPortalChatMessagesForSenderUid,
  portalChatSenderUidFromThreadId,
} from "@/features/backoffice/portalChatInboxLogic";

/**
 * Filtre les messages visibles dans un fil de chat portail.
 *
 * - Sans fil / `global` : tous les messages sans dossier.
 * - `__sender__:{uid}` : tout l’historique client + réponses staff liées.
 * - Dossier (`interventionId`) : messages taggés sur ce dossier.
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
