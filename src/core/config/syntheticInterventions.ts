const LEGACY_SEED_INTERVENTION_IDS = new Set(["1", "2", "3", "demo-mission-backoffice-only"]);

export function isSyntheticInterventionId(id: string): boolean {
  if (!id) return false;
  if (LEGACY_SEED_INTERVENTION_IDS.has(id)) return true;
  return id.startsWith("mock-day-");
}

/** Retire les dossiers seed / mock connus restants en base. */
export function stripKnownSyntheticInterventions<T extends { id: string }>(rows: T[]): T[] {
  return rows.filter((r) => !isSyntheticInterventionId(r.id));
}

/** @deprecated alias de {@link stripKnownSyntheticInterventions} */
export function excludeSyntheticInterventions<T extends { id: string }>(rows: T[]): T[] {
  return stripKnownSyntheticInterventions(rows);
}
