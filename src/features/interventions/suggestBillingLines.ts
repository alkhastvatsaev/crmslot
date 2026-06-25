import { BILLING_TEMPLATES } from "@/features/interventions/config/terrainTemplates";
import type { BillingLine } from "@/features/interventions/components/TechnicianBillingLinesForm";
import { billingTemplateIdForProblemTemplate } from "@/features/interventions/problemTemplateBillingMap";

function normalize(text: string): string {
  return text.toLowerCase().normalize("NFD").replace(/\p{M}/gu, "");
}

export function suggestBillingLinesFromTemplateId(templateId: string): BillingLine[] {
  const billingId = billingTemplateIdForProblemTemplate(templateId);
  if (!billingId) return [];
  const pick = BILLING_TEMPLATES.find((tpl) => tpl.id === billingId);
  if (!pick) return [];
  return pick.lines.map((l) => ({
    description: l.description,
    quantity: l.quantity,
    unitPriceCents: l.unitPriceCents ?? 0,
    reference: l.reference ?? "",
  }));
}

/** Suggestions locales (catalogue templates) quand l’IA n’est pas disponible. */
export function suggestBillingLinesFromProblem(
  problem: string,
  category?: string | null,
  problemTemplateId?: string | null
): BillingLine[] {
  if (problemTemplateId?.trim()) {
    const fromTemplate = suggestBillingLinesFromTemplateId(problemTemplateId);
    if (fromTemplate.length > 0) return fromTemplate;
  }

  const hay = normalize(problem);
  if (!hay.trim()) return [];

  const cat = (category ?? "general").toLowerCase();
  const ranked = BILLING_TEMPLATES.filter((tpl) => {
    if (tpl.category !== "general" && tpl.category !== cat) return false;
    const name = normalize(tpl.name);
    return tpl.lines.some((l) => hay.includes(normalize(l.description))) || hay.includes(name);
  });

  const pick =
    ranked[0] ??
    BILLING_TEMPLATES.find((t) => t.id === "bill-ouverture-claquee") ??
    BILLING_TEMPLATES[0];

  if (!pick) return [];

  return pick.lines.map((l) => ({
    description: l.description,
    quantity: l.quantity,
    unitPriceCents: l.unitPriceCents ?? 0,
    reference: l.reference ?? "",
  }));
}
