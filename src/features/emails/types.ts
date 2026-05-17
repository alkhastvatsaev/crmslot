export interface InterventionEmail {
  id: string;
  interventionId: string;
  companyId: string;
  direction: "outbound" | "inbound";
  from: string;
  to: string;
  subject: string;
  bodyText: string;
  bodyHtml?: string;
  /** RFC 2822 Message-ID, ex: <uuid@domain.com> */
  messageId: string;
  inReplyTo?: string;
  /** Message-IDs séparés par espace pour le thread. */
  references?: string;
  attachmentUrls?: string[];
  createdAt: unknown;
  sentByUid?: string;
  /** null = non-lu (inbound seulement). */
  readAt?: string | null;
}
