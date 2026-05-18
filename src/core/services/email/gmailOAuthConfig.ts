/** Config OAuth Gmail (env serveur uniquement). */

export function getGmailOAuthConfig() {
  const clientId = process.env.GOOGLE_CLIENT_ID?.trim() || "";
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim() || "";
  const redirectUri =
    process.env.GOOGLE_REDIRECT_URI?.trim() ||
    `${process.env.PUBLIC_APP_URL?.replace(/\/$/, "") || "http://localhost:3000"}/api/integrations/gmail/callback`;
  const refreshToken = process.env.GMAIL_REFRESH_TOKEN?.trim() || "";
  const senderEmail = process.env.GMAIL_USER?.trim() || "";

  return { clientId, clientSecret, redirectUri, refreshToken, senderEmail };
}

export function isGmailOAuthConfigured(): boolean {
  const c = getGmailOAuthConfig();
  return Boolean(c.clientId && c.clientSecret && c.refreshToken && c.senderEmail);
}

export function isGmailOAuthClientConfigured(): boolean {
  const c = getGmailOAuthConfig();
  return Boolean(c.clientId && c.clientSecret);
}

export const GMAIL_SEND_SCOPE = "https://www.googleapis.com/auth/gmail.send";
