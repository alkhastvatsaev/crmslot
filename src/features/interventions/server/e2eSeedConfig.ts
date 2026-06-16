/** IDs société / technicien pour seeds Playwright — variables d'environnement serveur uniquement. */

export function getE2eSeedCompanyId(): string {
  const id = process.env.E2E_SEED_COMPANY_ID?.trim();
  if (!id) throw new Error("E2E_SEED_COMPANY_ID manquant");
  return id;
}

export function getE2eSeedTechnicianUid(): string {
  const uid = process.env.E2E_SEED_TECHNICIAN_UID?.trim();
  if (!uid) throw new Error("E2E_SEED_TECHNICIAN_UID manquant");
  return uid;
}

export function isE2eSeedAllowed(): boolean {
  if (process.env.NODE_ENV === "production" && process.env.VERCEL_ENV === "production") {
    return false;
  }
  return Boolean(
    process.env.E2E_SEED_COMPANY_ID?.trim() && process.env.E2E_SEED_TECHNICIAN_UID?.trim()
  );
}
