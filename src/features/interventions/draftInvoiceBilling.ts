import { getClient } from "@/core/services/audio/transcription";
import {
  buildInterventionBillingContextText,
  enrichDraftBillingLines,
  interventionProblemText,
  type InterventionBillingContext,
} from "@/features/interventions/interventionBillingContext";
import { suggestBillingLinesFromProblem } from "@/features/interventions/suggestBillingLines";
import type { Intervention } from "@/features/interventions/types";

export type DraftBillingLine = {
  description: string;
  quantity: number;
  unitPriceCents: number;
  reference?: string;
};

export type DraftBillingPackage = {
  lines: DraftBillingLine[];
  invoiceAmountCents: number;
  source: "template" | "openai" | "existing";
  aiNote?: string;
};

export function totalCentsFromBillingLines(lines: DraftBillingLine[]): number {
  return lines.reduce(
    (sum, l) => sum + Math.round(l.unitPriceCents) * (l.quantity > 0 ? l.quantity : 1),
    0
  );
}

function normalizeLines(lines: DraftBillingLine[]): DraftBillingLine[] {
  return lines
    .map((l) => ({
      description: String(l.description ?? "").trim(),
      quantity: Number(l.quantity) > 0 ? Number(l.quantity) : 1,
      unitPriceCents: Math.max(0, Math.round(Number(l.unitPriceCents) || 0)),
      reference: l.reference?.trim() || "",
    }))
    .filter((l) => l.description.length > 0);
}

/** Proposition locale à partir du formulaire client + catégorie. */
export function buildTemplateDraftBilling(iv: InterventionBillingContext): DraftBillingLine[] {
  const problem = interventionProblemText(iv);
  const seed = normalizeLines(suggestBillingLinesFromProblem(problem, iv.category ?? null));
  return enrichDraftBillingLines(iv, seed);
}

const OPENAI_BILLING_SYSTEM = `Tu es contrôleur facturation pour une entreprise de dépannage (serrurerie, vitrerie).
On te donne le contexte complet du dossier (demande client, adresse, créneau, urgence, durée terrain, photos) et un brouillon de lignes.
Objectif : facture automatique précise pour le technicien terrain — aucune saisie manuelle.
- Choisis le forfait / pièces cohérents avec la demande client et la catégorie.
- Déplacement : urgent si urgence/priorité haute ou créneau hors heures ouvrables ; sinon forfaitaire ; trajet long si adresse éloignée.
- Main d'œuvre et pièces : quantités réalistes selon le type d'intervention décrit.
- Montants en centimes EUR (marché belge serrurerie) ; ne laisse pas de ligne à 0 si elle doit être facturée.
Réponds UNIQUEMENT en JSON : { "lines": [...], "note": "courte explication (1 phrase)" }
Chaque ligne : description (string), quantity (number), unitPriceCents (number), reference (string optionnel).`;

/** Enrichit / valide le brouillon via OpenAI (gpt-4o-mini par défaut). */
export async function refineDraftBillingWithOpenAI(
  iv: InterventionBillingContext,
  seedLines: DraftBillingLine[]
): Promise<{ lines: DraftBillingLine[]; note?: string }> {
  if (!process.env.OPENAI_API_KEY?.trim()) {
    return { lines: enrichDraftBillingLines(iv, seedLines) };
  }

  const client = getClient();
  const model = process.env.OPENAI_DISPATCH_MODEL?.trim() || "gpt-4o-mini";
  const context = buildInterventionBillingContextText(iv);

  const completion = await client.chat.completions.create({
    model,
    temperature: 0.15,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: OPENAI_BILLING_SYSTEM },
      {
        role: "user",
        content: `Contexte :\n${context}\n\nBrouillon :\n${JSON.stringify(seedLines, null, 2)}`,
      },
    ],
  });

  const raw = completion.choices[0]?.message?.content ?? "{}";
  try {
    const parsed = JSON.parse(raw) as { lines?: DraftBillingLine[]; note?: string };
    const rawLines = normalizeLines(Array.isArray(parsed.lines) ? parsed.lines : seedLines);
    const lines =
      rawLines.length > 0
        ? enrichDraftBillingLines(iv, rawLines)
        : enrichDraftBillingLines(iv, seedLines);
    if (lines.length === 0)
      return { lines: enrichDraftBillingLines(iv, seedLines), note: parsed.note };
    return { lines, note: typeof parsed.note === "string" ? parsed.note : undefined };
  } catch {
    return { lines: enrichDraftBillingLines(iv, seedLines) };
  }
}

/**
 * Brouillon facture pour validation back-office (pas de facture PDF tant que non validé).
 * Réutilise les lignes existantes si déjà présentes et cohérentes.
 */
export async function buildDraftBillingPackage(
  iv: InterventionBillingContext & Pick<Intervention, "billingLines">,
  opts?: { forceRegenerate?: boolean }
): Promise<DraftBillingPackage> {
  const existing = normalizeLines(
    (Array.isArray(iv.billingLines) ? iv.billingLines : []) as DraftBillingLine[]
  );
  if (existing.length > 0 && !opts?.forceRegenerate) {
    return {
      lines: existing,
      invoiceAmountCents: totalCentsFromBillingLines(existing),
      source: "existing",
    };
  }

  const templateLines = buildTemplateDraftBilling(iv);
  const seed = templateLines.length > 0 ? templateLines : existing;
  const { lines, note } = await refineDraftBillingWithOpenAI(iv, seed);
  const finalLines =
    lines.length > 0 ? lines : enrichDraftBillingLines(iv, seed.length > 0 ? seed : templateLines);

  return {
    lines: finalLines,
    invoiceAmountCents: totalCentsFromBillingLines(finalLines),
    source: lines.length > 0 && lines !== seed ? "openai" : "template",
    aiNote: note,
  };
}
