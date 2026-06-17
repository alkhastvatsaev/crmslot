/** Société unique staff (admin + technicien) — même variable que le portail client. */
export function readDefaultStaffCompanyIdFromEnv(): string {
  const raw = process.env.NEXT_PUBLIC_CLIENT_PORTAL_DEFAULT_COMPANY_ID;
  return typeof raw === "string" ? raw.trim() : "";
}
