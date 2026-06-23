import type { IvanaPortalChatDoc } from "@/features/backoffice";
import type { Intervention } from "@/features/interventions";
import type { CrmActivityEvent } from "./crmActivityTypes";
import { parseTs } from "./crmActivityLog";

function excerpt(body: string, max = 120): string {
  const t = body.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1)}…`;
}

export function synthesizeIvanaChatEvents(
  messages: IvanaPortalChatDoc[],
  interventionMap: Map<string, Intervention>
): CrmActivityEvent[] {
  return messages
    .map((m) => {
      const ts = parseTs(m.createdAt);
      if (!ts) return null;
      const iv = m.interventionId ? interventionMap.get(m.interventionId) : undefined;
      const clientName =
        iv?.clientCompanyName ??
        iv?.clientName ??
        (iv?.clientFirstName || iv?.clientLastName
          ? [iv.clientFirstName, iv.clientLastName].filter(Boolean).join(" ")
          : undefined);
      return {
        id: `ivana:${m.id}`,
        type: "ivana_chat_message" as const,
        ts,
        interventionId: m.interventionId ?? undefined,
        interventionTitle: iv?.title,
        clientName,
        address: iv?.address,
        chatRole: m.role,
        actorUid: m.senderUid,
        actorRole: m.role === "staff" ? "dispatcher" : "client",
        note: excerpt(m.body),
      };
    })
    .filter((e): e is NonNullable<typeof e> => e !== null);
}
