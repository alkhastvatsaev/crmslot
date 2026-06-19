/** Docs Firestore seed dev (`technicians/1`, `2`, `3`). */
const LEGACY_DEMO_TECHNICIAN_IDS = new Set(["1", "2", "3"]);

const LEGACY_DEMO_TECHNICIAN_NAME_PATTERNS = [
  /^alexandre\s*v\.?$/i,
  /^thomas\s*l\.?$/i,
  /^boris\s*k\.?$/i,
];

export function isLegacyDemoTechnician(params: {
  id?: string | null;
  name?: string | null;
  displayName?: string | null;
}): boolean {
  const id = (params.id ?? "").trim();
  if (LEGACY_DEMO_TECHNICIAN_IDS.has(id)) return true;

  const label = (params.name ?? params.displayName ?? "").trim();
  if (!label) return false;
  return LEGACY_DEMO_TECHNICIAN_NAME_PATTERNS.some((re) => re.test(label));
}

/** Retire les techniciens démo historiques encore présents en base. */
export function stripLegacyDemoTechnicians<
  T extends { id?: string; name?: string; displayName?: string; uid?: string },
>(rows: T[]): T[] {
  return rows.filter(
    (row) =>
      !isLegacyDemoTechnician({
        id: row.id ?? row.uid,
        name: row.name,
        displayName: row.displayName,
      })
  );
}
