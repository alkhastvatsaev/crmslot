import type { DashboardPagerApi } from "@/features/dashboard/dashboardPagerContext";
import { navigateMaterialAgentWithQuickPrompt } from "@/features/featureHub/companyStockChatbot";
import { resolveInterventionClientName } from "@/features/interventions/resolveInterventionClientName";
import type { Intervention } from "@/features/interventions/types";
import { buildInterventionMaterialOrderPrompt } from "@/features/materials/interventionMaterialOrderPrompt";
import type { CatalogMatchedPart } from "@/features/materials/matchStockCatalogItem";

type InterventionPick = Pick<
  Intervention,
  "id" | "clientFirstName" | "clientLastName" | "clientName" | "clientCompanyName" | "title"
>;

/** Ouvre la page Matériel, focus l'article si connu, commande via agent (même flux que le modal stock). */
export function orderInterventionPartViaMaterialAgent(
  pager: DashboardPagerApi | null | undefined,
  intervention: InterventionPick,
  part: CatalogMatchedPart
): void {
  const clientName = resolveInterventionClientName(intervention);
  const description = part.catalogDescription?.trim() || part.description;
  const reference = part.catalogReference?.trim() || part.reference?.trim() || null;
  const prompt = buildInterventionMaterialOrderPrompt({
    quantity: part.quantity || 1,
    description,
    reference,
    interventionId: intervention.id,
    clientName,
  });

  navigateMaterialAgentWithQuickPrompt(pager, prompt, {
    stockItemId: part.stockItemId ?? null,
  });
}
