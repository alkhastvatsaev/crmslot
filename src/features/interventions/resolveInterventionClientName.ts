import type { Intervention } from "@/features/interventions/types";

type ClientFields = Pick<
  Intervention,
  "clientFirstName" | "clientLastName" | "clientName" | "clientCompanyName" | "title"
>;

/** Nom affiché client (PDF, listes) — même logique que le snapshot copilot. */
export function resolveInterventionClientName(iv: ClientFields): string {
  const parts = [iv.clientFirstName, iv.clientLastName].filter(Boolean).join(" ").trim();
  if (parts) return parts;
  if (iv.clientName?.trim()) return iv.clientName.trim();
  if (iv.clientCompanyName?.trim()) return iv.clientCompanyName.trim();
  return iv.title?.trim() || "Client";
}

export function resolveInterventionClientNameFromRecord(
  data: Record<string, unknown>,
): string {
  return resolveInterventionClientName({
    clientFirstName:
      typeof data.clientFirstName === "string" ? data.clientFirstName : undefined,
    clientLastName:
      typeof data.clientLastName === "string" ? data.clientLastName : undefined,
    clientName: typeof data.clientName === "string" ? data.clientName : undefined,
    clientCompanyName:
      typeof data.clientCompanyName === "string" ? data.clientCompanyName : undefined,
    title: typeof data.title === "string" ? data.title : "",
  });
}

/** Remplit clientName Firestore si vide mais prénom/nom société connus. */
export function clientNameFirestorePatchIfMissing(
  data: Record<string, unknown>,
  override?: string,
): { clientName: string } | null {
  const explicit = override?.trim();
  const existing = typeof data.clientName === "string" ? data.clientName.trim() : "";
  if (explicit) return { clientName: explicit };
  if (existing) return null;
  const resolved = resolveInterventionClientNameFromRecord(data);
  if (!resolved || resolved === "Client") return null;
  return { clientName: resolved };
}
