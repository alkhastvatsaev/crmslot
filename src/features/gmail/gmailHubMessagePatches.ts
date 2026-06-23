import type { GmailHubMessageSummary } from "@/features/gmail/gmailHubTypes";

export function patchUnreadInList(
  list: GmailHubMessageSummary[],
  messageId: string,
  isUnread: boolean
): GmailHubMessageSummary[] {
  return list.map((msg) =>
    msg.id === messageId
      ? {
          ...msg,
          isUnread,
          labelIds: isUnread
            ? [...msg.labelIds.filter((l) => l !== "UNREAD"), "UNREAD"]
            : msg.labelIds.filter((l) => l !== "UNREAD"),
        }
      : msg
  );
}
