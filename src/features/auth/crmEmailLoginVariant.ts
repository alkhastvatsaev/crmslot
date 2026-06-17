export type CrmEmailLoginVariant = "technician" | "admin";
export type CrmEmailAuthTab = "login" | "register";

export function crmEmailLoginTestId(variant: CrmEmailLoginVariant, part: string): string {
  const prefix = variant === "technician" ? "technician" : "admin";
  return `${prefix}-login-${part}`;
}

export function crmEmailLoginTitleKey(variant: CrmEmailLoginVariant): string {
  return variant === "technician" ? "auth.technician_space_title" : "auth.admin_space_title";
}

export function crmEmailLoginSubtitleKey(variant: CrmEmailLoginVariant): string {
  return variant === "technician" ? "auth.technician_space_subtitle" : "auth.admin_space_subtitle";
}
