export const CRM_STAFF_OAUTH_MODE_KEY = "crm_staff_oauth_mode";

export type CrmStaffOAuthMode = "login" | "register";

export function persistCrmStaffOAuthMode(mode: CrmStaffOAuthMode): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(CRM_STAFF_OAUTH_MODE_KEY, mode);
}

export function peekCrmStaffOAuthMode(): CrmStaffOAuthMode | null {
  if (typeof window === "undefined") return null;
  const raw = window.sessionStorage.getItem(CRM_STAFF_OAUTH_MODE_KEY);
  if (raw === "register") return "register";
  if (raw === "login") return "login";
  return null;
}

export function consumeCrmStaffOAuthMode(): CrmStaffOAuthMode {
  const peeked = peekCrmStaffOAuthMode();
  if (typeof window !== "undefined") {
    window.sessionStorage.removeItem(CRM_STAFF_OAUTH_MODE_KEY);
  }
  return peeked ?? "login";
}

export function crmStaffOAuthModeFromAuthTab(authTab: "login" | "register"): CrmStaffOAuthMode {
  return authTab === "register" ? "register" : "login";
}
