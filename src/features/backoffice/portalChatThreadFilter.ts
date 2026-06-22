import type { IvanaPortalChatDoc } from "@/features/backoffice/ivanaChatFirestore";

/**
 * Filtre les messages visibles dans un fil de chat portail.
 *
 * - Staff / global : tous les messages société.
 * - Client dossier : messages du dossier + réponses staff sans tag (legacy / global).
 */
export function filterPortalChatMessagesForThread(
  rows: IvanaPortalChatDoc[],
  threadInterventionId?: string | null
): IvanaPortalChatDoc[] {
  const threadIvId = (threadInterventionId ?? "").trim();
  if (!threadIvId) return rows;

  return rows.filter((r) => {
    const msgIvId = r.interventionId?.trim() ?? "";
    if (!msgIvId) return r.role === "staff";
    return msgIvId === threadIvId;
  });
}
