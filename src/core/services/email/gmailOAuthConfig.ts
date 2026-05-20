/** Config OAuth Gmail — variables d’environnement + jetons Firestore (connexion via UI). */

import {
  clearStoredGmailOAuth,
  getStoredGmailOAuth,
  saveStoredGmailOAuth,
} from "@/core/services/email/gmailOAuthStore";

export type GmailOAuthResolved = {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  refreshToken: string;
  senderEmail: string;
};

let cache: GmailOAuthResolved | null = null;
let cacheAt = 0;
const CACHE_MS = 8_000;

export function invalidateGmailOAuthConfigCache(): void {
  cache = null;
  cacheAt = 0;
}

function envConfig(): GmailOAuthResolved {
  const clientId = process.env.GOOGLE_CLIENT_ID?.trim() || "";
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim() || "";
  const redirectUri =
    process.env.GOOGLE_REDIRECT_URI?.trim() ||
    `${process.env.PUBLIC_APP_URL?.replace(/\/$/, "") || "http://localhost:3000"}/api/integrations/gmail/callback`;
  const refreshToken = process.env.GMAIL_REFRESH_TOKEN?.trim() || "";
  const senderEmail = process.env.GMAIL_USER?.trim() || "";

  return { clientId, clientSecret, redirectUri, refreshToken, senderEmail };
}

/** Fusionne .env et Firestore (Firestore prioritaire pour refresh + email). */
export async function resolveGmailOAuthConfig(): Promise<GmailOAuthResolved> {
  if (cache && Date.now() - cacheAt < CACHE_MS) return cache;

  const env = envConfig();
  const stored = await getStoredGmailOAuth();
  cache = {
    clientId: env.clientId,
    clientSecret: env.clientSecret,
    redirectUri: env.redirectUri,
    refreshToken: stored?.refreshToken || env.refreshToken,
    senderEmail: stored?.email || env.senderEmail,
  };
  cacheAt = Date.now();
  return cache;
}

/** @deprecated Préférer resolveGmailOAuthConfig — garde la compat env seule. */
export function getGmailOAuthConfig(): GmailOAuthResolved {
  return envConfig();
}

export async function isGmailOAuthConfigured(): Promise<boolean> {
  const c = await resolveGmailOAuthConfig();
  return Boolean(c.clientId && c.clientSecret && c.refreshToken && c.senderEmail);
}

export function isGmailOAuthClientConfigured(): boolean {
  const c = envConfig();
  return Boolean(c.clientId && c.clientSecret);
}

export async function persistGmailOAuthFromCallback(input: {
  refreshToken: string;
  email: string;
}): Promise<void> {
  await saveStoredGmailOAuth(input);
  invalidateGmailOAuthConfigCache();
}

export async function revokeStoredGmailOAuth(): Promise<void> {
  await clearStoredGmailOAuth();
  invalidateGmailOAuthConfigCache();
}

export const GMAIL_SEND_SCOPE = "https://www.googleapis.com/auth/gmail.send";

export { GMAIL_HUB_SCOPES } from "@/core/services/email/gmailHubScopes";
