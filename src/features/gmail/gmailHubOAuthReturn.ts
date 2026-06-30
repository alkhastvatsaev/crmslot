/** Marqueur sessionStorage — retour OAuth boîte Gmail (pas Firebase Auth CRM). */
export const GMAIL_HUB_OAUTH_PENDING_KEY = "gmail_hub_oauth_pending";

export function isGmailHubOAuthReturnUrl(search?: string): boolean {
  if (typeof window === "undefined" && search == null) return false;
  const params = new URLSearchParams(search ?? window.location.search);
  return params.has("gmail_connected") || params.has("gmail_error");
}

export function markGmailHubOAuthPending(): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(GMAIL_HUB_OAUTH_PENDING_KEY, "1");
}

export function clearGmailHubOAuthPending(): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(GMAIL_HUB_OAUTH_PENDING_KEY);
}

export function isGmailHubOAuthPending(): boolean {
  if (typeof window === "undefined") return false;
  return window.sessionStorage.getItem(GMAIL_HUB_OAUTH_PENDING_KEY) === "1";
}

/** Ne pas finaliser un redirect Firebase CRM (Google/Apple staff). */
export function shouldSkipCrmStaffOAuthRedirectHandling(search?: string): boolean {
  return isGmailHubOAuthReturnUrl(search) || isGmailHubOAuthPending();
}
