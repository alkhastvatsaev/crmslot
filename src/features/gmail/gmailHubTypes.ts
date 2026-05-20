export type GmailHubStatus = {
  oauthConfigured: boolean;
  oauthClientConfigured: boolean;
  smtpConfigured: boolean;
  email: string | null;
  /** true en `npm run dev` — pas de login Firebase obligatoire pour le hub Gmail. */
  devLocalMode?: boolean;
  /** Déconnexion volontaire depuis la page 6 (cookie — réversible via OAuth). */
  userDisconnected?: boolean;
};

export type GmailHubLabel = {
  id: string;
  name: string;
  type: string;
  messagesTotal: number;
  messagesUnread: number;
};

export type GmailHubMessageSummary = {
  id: string;
  threadId: string;
  snippet: string;
  from: string;
  to: string;
  subject: string;
  date: string;
  labelIds: string[];
  isUnread: boolean;
};

export type GmailHubAttachment = {
  attachmentId: string;
  filename: string;
  mimeType: string;
  size: number;
};

export type GmailHubMessageDetail = GmailHubMessageSummary & {
  bodyText: string;
  bodyHtml: string;
  messageIdHeader: string;
  referencesHeader: string;
  attachments: GmailHubAttachment[];
};

export type GmailHubInboxPage = {
  messages: GmailHubMessageSummary[];
  nextPageToken: string | null;
};
