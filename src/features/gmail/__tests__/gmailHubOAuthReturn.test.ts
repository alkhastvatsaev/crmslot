import {
  GMAIL_HUB_OAUTH_PENDING_KEY,
  clearGmailHubOAuthPending,
  isGmailHubOAuthReturnUrl,
  markGmailHubOAuthPending,
  shouldSkipCrmStaffOAuthRedirectHandling,
} from "@/features/gmail/gmailHubOAuthReturn";

describe("gmailHubOAuthReturn", () => {
  beforeEach(() => {
    window.sessionStorage.clear();
  });

  it("détecte le retour OAuth Gmail dans l'URL", () => {
    expect(isGmailHubOAuthReturnUrl("?gmail_connected=1")).toBe(true);
    expect(isGmailHubOAuthReturnUrl("?gmail_error=access_denied")).toBe(true);
    expect(isGmailHubOAuthReturnUrl("?page=3")).toBe(false);
  });

  it("ignore le redirect CRM staff pendant le flux Gmail", () => {
    markGmailHubOAuthPending();
    expect(window.sessionStorage.getItem(GMAIL_HUB_OAUTH_PENDING_KEY)).toBe("1");
    expect(shouldSkipCrmStaffOAuthRedirectHandling()).toBe(true);
    clearGmailHubOAuthPending();
    expect(shouldSkipCrmStaffOAuthRedirectHandling()).toBe(false);
  });
});
