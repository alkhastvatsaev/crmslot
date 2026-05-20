/** Scopes OAuth pour le hub Gmail (lecture, envoi, brouillons, libellés). */
export const GMAIL_HUB_SCOPES = [
  "https://www.googleapis.com/auth/gmail.modify",
  "https://www.googleapis.com/auth/gmail.compose",
  "https://www.googleapis.com/auth/gmail.send",
  "https://www.googleapis.com/auth/userinfo.email",
] as const;
