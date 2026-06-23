import { coerceFirestoreLikeDate } from "@/features/interventions/technicianSchedule";
import type { PortalChatDoc } from "@/features/backoffice/portalChatFirestore";
import {
  type CompanyChatMessage,
  companyChatWelcomeMessage,
} from "@/features/backoffice/companyChatTypes";

export function mapPortalChatRowsToMessages(rows: PortalChatDoc[]): CompanyChatMessage[] {
  return rows
    .map((r) => {
      const ts = coerceFirestoreLikeDate(r.createdAt)?.getTime() ?? Date.now();
      let role: CompanyChatMessage["role"] = "user";
      if (r.role === "client") role = "client";
      else if (r.role === "staff") role = "staff";
      return {
        id: `fs-${r.id}`,
        role,
        text: r.body,
        createdAt: ts,
        senderName: typeof r.senderName === "string" ? r.senderName : undefined,
        senderUid: r.senderUid,
        images: Array.isArray(r.imageUrls) && r.imageUrls.length > 0 ? r.imageUrls : undefined,
      };
    })
    .sort((a, b) => a.createdAt - b.createdAt);
}

export function mergeCompanyChatWithOptimistic(params: {
  mapped: CompanyChatMessage[];
  filteredRows: PortalChatDoc[];
  prev: CompanyChatMessage[];
  pendingDocIdRef: Map<string, string>;
  welcome: CompanyChatMessage;
}): CompanyChatMessage[] {
  const { mapped, filteredRows, prev, pendingDocIdRef, welcome } = params;
  const confirmedIds = new Set(filteredRows.map((r) => r.id));
  const contentKeys = new Set(filteredRows.map((r) => `${(r.senderUid ?? "").trim()}::${r.body}`));
  const optimistic = prev.filter((m) => {
    if (!m.id.startsWith("pending-")) return false;
    if (m.failed) return true;
    const tempId = m.id.slice("pending-".length);
    const docId = pendingDocIdRef.get(tempId);
    if (docId && confirmedIds.has(docId)) {
      pendingDocIdRef.delete(tempId);
      return false;
    }
    if (contentKeys.has(`${(m.senderUid ?? "").trim()}::${m.text}`)) {
      pendingDocIdRef.delete(tempId);
      return false;
    }
    return true;
  });
  const base = mapped.length === 0 && optimistic.length === 0 ? [welcome] : mapped;
  return [...base, ...optimistic].sort((a, b) => a.createdAt - b.createdAt);
}

export function companyChatWelcome(t: (key: string) => string): CompanyChatMessage {
  return companyChatWelcomeMessage(t);
}
