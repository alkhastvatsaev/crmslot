import { BILLING_TEMPLATES } from "@/features/interventions/config/terrainTemplates";
import {
  totalCentsFromBillingLines,
  type DraftBillingLine,
} from "@/features/interventions/draftInvoiceBilling";
import {
  enrichDraftBillingLines,
  interventionProblemText,
  resolveTravelUnitPriceCents,
  type InterventionBillingContext,
} from "@/features/interventions/interventionBillingContext";
import { billingTemplateIdForProblemTemplate } from "@/features/interventions/problemTemplateBillingMap";
import { suggestBillingLinesFromProblem } from "@/features/interventions/suggestBillingLines";

export type InterventionPriceEstimateInput = {
  problemTemplateId?: string | null;
  problem?: string | null;
  problemLabel?: string | null;
  title?: string | null;
  transcription?: string | null;
  category?: string | null;
  address?: string | null;
  urgency?: boolean;
  scheduledDate?: string | null;
  scheduledTime?: string | null;
  requestedDate?: string | null;
  requestedTime?: string | null;
};

export type InterventionPriceEstimate = {
  lines: DraftBillingLine[];
  totalCents: number;
  /** 1 = standard, 2 = urgent / hors heures, 3 = longue distance */
  travelZone: 1 | 2 | 3;
};

function toBillingContext(input: InterventionPriceEstimateInput): InterventionBillingContext {
  const problem = [input.problem, input.problemLabel].filter(Boolean).join(" ").trim();
  return {
    ...(problem ? { problem } : {}),
    ...(input.title ? { title: input.title } : {}),
    ...(input.transcription ? { transcription: input.transcription } : {}),
    category: (input.category as InterventionBillingContext["category"]) ?? "serrurerie",
    ...(input.address ? { address: input.address } : {}),
    urgency: input.urgency ?? false,
    ...(input.scheduledDate ? { scheduledDate: input.scheduledDate } : {}),
    ...(input.scheduledTime ? { scheduledTime: input.scheduledTime } : {}),
    ...(input.requestedDate ? { requestedDate: input.requestedDate } : {}),
    ...(input.requestedTime ? { requestedTime: input.requestedTime } : {}),
  };
}

function resolveTravelZone(travelCents: number): 1 | 2 | 3 {
  if (travelCents >= 5500) return 3;
  if (travelCents >= 4500) return 2;
  return 1;
}

function linesFromBillingTemplateId(templateId: string): DraftBillingLine[] {
  const tpl = BILLING_TEMPLATES.find((item) => item.id === templateId);
  if (!tpl) return [];
  return tpl.lines.map((line) => ({
    description: line.description,
    quantity: line.quantity,
    unitPriceCents: line.unitPriceCents,
    reference: line.reference ?? "",
  }));
}

function seedLinesForEstimate(input: InterventionPriceEstimateInput): DraftBillingLine[] {
  const billingTemplateId = input.problemTemplateId
    ? billingTemplateIdForProblemTemplate(input.problemTemplateId)
    : null;
  if (billingTemplateId) {
    const fromTemplate = linesFromBillingTemplateId(billingTemplateId);
    if (fromTemplate.length > 0) return fromTemplate;
  }

  const problem = interventionProblemText(toBillingContext(input));
  return suggestBillingLinesFromProblem(problem, input.category ?? null);
}

/** Estimation HT déterministe (forfait type + déplacement zone 1/2/3 + majoration éventuelle). */
export function estimateInterventionBilling(
  input: InterventionPriceEstimateInput
): InterventionPriceEstimate | null {
  const seed = seedLinesForEstimate(input);
  if (seed.length === 0) return null;

  const context = toBillingContext(input);
  const lines = enrichDraftBillingLines(context, seed);
  if (lines.length === 0) return null;

  const travelCents = resolveTravelUnitPriceCents(context);
  return {
    lines,
    totalCents: totalCentsFromBillingLines(lines),
    travelZone: resolveTravelZone(travelCents),
  };
}
