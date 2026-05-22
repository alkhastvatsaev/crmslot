import type { MaterialOrderDoc } from "@/features/materials/materialOrderFirestore";

/** Libellé affiché quand aucun nom client n’est encore en base (commandes historiques). */
export const MATERIAL_ORDER_CLIENT_FALLBACK = "Client";

/** Nom client sur le bon de commande Firestore (`clientName` ou champ legacy `nom`). */
export function readStoredOrderClientName(data: Record<string, unknown>): string | null {
  for (const key of ["clientName", "nom", "nomClient", "client"] as const) {
    const raw = data[key];
    if (typeof raw === "string" && raw.trim()) return raw.trim();
  }
  return null;
}

export function requireMaterialOrderClientName(raw: string | null | undefined): string {
  const name = typeof raw === "string" ? raw.trim() : "";
  if (!name) {
    throw new Error("clientName requis pour une commande matériel");
  }
  return name;
}

/** Nom client pour listes commandes — champ stocké, puis dossier lié, sinon repli. */
export function displayMaterialOrderClientName(
  order: Pick<MaterialOrderDoc, "clientName" | "interventionId">,
  labelByInterventionId?: Map<string, string>,
): string {
  const stored = order.clientName?.trim();
  if (stored) return stored;
  const ivId = order.interventionId?.trim();
  if (ivId && labelByInterventionId) {
    const fromIv = labelByInterventionId.get(ivId)?.trim();
    if (fromIv) return fromIv;
  }
  return MATERIAL_ORDER_CLIENT_FALLBACK;
}
