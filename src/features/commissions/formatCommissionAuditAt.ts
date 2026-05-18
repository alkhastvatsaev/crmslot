/** Affichage lisible d'un horodatage Firestore / ISO. */
export function formatCommissionAuditAt(value: unknown): string {
  if (!value) return "—";
  if (typeof value === "string") {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? value : d.toLocaleString();
  }
  if (typeof value === "object" && value !== null && "toDate" in value) {
    const maybe = value as { toDate?: () => Date };
    if (typeof maybe.toDate === "function") {
      return maybe.toDate().toLocaleString();
    }
  }
  return "—";
}
