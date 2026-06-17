export const CRM_STAFF_OAUTH_MODE_KEY = "crm_staff_oauth_mode";

export type CrmStaffOAuthMode = "login" | "register";

export function persistCrmStaffOAuthMode(mode: CrmStaffOAuthMode): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(CRM_STAFF_OAUTH_MODE_KEY, mode);
}

export function consumeCrmStaffOAuthMode(): CrmStaffOAuthMode {
  if (typeof window === "undefined") return "login";
  const raw = window.sessionStorage.getItem(CRM_STAFF_OAUTH_MODE_KEY);
  window.sessionStorage.removeItem(CRM_STAFF_OAUTH_MODE_KEY);
  return raw === "register" ? "register" : "login";
}

export function crmStaffOAuthModeFromAuthTab(authTab: "login" | "register"): CrmStaffOAuthMode {
  return authTab === "register" ? "register" : "login";
}
