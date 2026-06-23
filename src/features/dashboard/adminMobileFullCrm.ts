/** Évite le redirect satellite admin → `/m/admin` (accès carrousel complet sur mobile). */
export const ADMIN_MOBILE_FULL_CRM_QUERY = "fullCrm";

export function prefersFullCrmOnMobile(search: string = ""): boolean {
  if (!search) return false;
  try {
    return new URLSearchParams(search).get(ADMIN_MOBILE_FULL_CRM_QUERY) === "1";
  } catch {
    return false;
  }
}

export function buildFullCrmMobileHref(): string {
  return `/?${ADMIN_MOBILE_FULL_CRM_QUERY}=1`;
}
