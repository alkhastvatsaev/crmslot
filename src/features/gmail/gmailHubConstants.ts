/** Index carrousel du hub Gmail PWA (7ᵉ page, index 0-based). */
export const GMAIL_HUB_SLOT_INDEX = 6;

/** Libellés système Gmail affichés dans le rail gauche. */
export const GMAIL_HUB_SYSTEM_LABELS = [
  { id: "INBOX", labelKey: "gmail.hub.label_inbox" },
  { id: "STARRED", labelKey: "gmail.hub.label_starred" },
  { id: "SENT", labelKey: "gmail.hub.label_sent" },
  { id: "DRAFT", labelKey: "gmail.hub.label_drafts" },
  { id: "UNREAD", labelKey: "gmail.hub.label_unread" },
  { id: "TRASH", labelKey: "gmail.hub.label_trash" },
] as const;
