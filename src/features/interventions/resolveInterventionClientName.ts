import type { Intervention } from "@/features/interventions/types";
import { coerceDisplayString } from "@/features/interventions/technicianSchedule";

type ClientFields = Pick<
  Intervention,
  "clientFirstName" | "clientLastName" | "clientName" | "clientCompanyName" | "title"
>;

/** Nom affiché client (PDF, listes) — même logique que le snapshot copilot. */
export function resolveInterventionClientName(iv: ClientFields): string {
  const parts = [coerceDisplayString(iv.clientFirstName), coerceDisplayString(iv.clientLastName)]
    .filter(Boolean)
    .join(" ")
    .trim();
  if (parts) return parts;
  const clientName = coerceDisplayString(iv.clientName);
  if (clientName) return clientName;
  const company = coerceDisplayString(iv.clientCompanyName);
  if (company) return company;
  return coerceDisplayString(iv.title) || "Client";
}

export function resolveInterventionClientNameFromRecord(data: Record<string, unknown>): string {
  return resolveInterventionClientName({
    clientFirstName: coerceDisplayString(data.clientFirstName) ?? undefined,
    clientLastName: coerceDisplayString(data.clientLastName) ?? undefined,
    clientName: coerceDisplayString(data.clientName) ?? undefined,
    clientCompanyName: coerceDisplayString(data.clientCompanyName) ?? undefined,
    title: coerceDisplayString(data.title) ?? "",
  });
}

/** Remplit clientName Firestore si vide mais prénom/nom société connus. */
export function clientNameFirestorePatchIfMissing(
  data: Record<string, unknown>,
  override?: string
): { clientName: string } | null {
  const explicit = override?.trim();
  const existing = typeof data.clientName === "string" ? data.clientName.trim() : "";
  if (explicit) return { clientName: explicit };
  if (existing) return null;
  const resolved = resolveInterventionClientNameFromRecord(data);
  if (!resolved || resolved === "Client") return null;
  return { clientName: resolved };
}
