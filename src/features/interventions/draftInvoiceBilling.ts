import { getClient } from "@/core/services/audio/transcription";
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
    0,
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
export function buildTemplateDraftBilling(
  iv: Pick<Intervention, "problem" | "title" | "category">,
): DraftBillingLine[] {
  const problem = [iv.problem, iv.title].filter(Boolean).join(" ").trim();
  return normalizeLines(suggestBillingLinesFromProblem(problem, iv.category ?? null));
}

const OPENAI_BILLING_SYSTEM = `Tu es contrôleur facturation pour une entreprise de dépannage (serrurerie, vitrerie).
On te donne le contexte client et un brouillon de lignes facture.
Vérifie la cohérence (déplacement, main d'œuvre, pièces) et ajuste les montants si le brouillon est à 0.
Réponds UNIQUEMENT en JSON : { "lines": [...], "note": "courte explication" }
Chaque ligne : description (string), quantity (number), unitPriceCents (number, centimes EUR), reference (string optionnel).`;

/** Enrichit / valide le brouillon via OpenAI (gpt-4o-mini par défaut). */
export async function refineDraftBillingWithOpenAI(
  iv: Pick<Intervention, "problem" | "title" | "category" | "address" | "clientName">,
  seedLines: DraftBillingLine[],
): Promise<{ lines: DraftBillingLine[]; note?: string }> {
  if (!process.env.OPENAI_API_KEY?.trim()) {
    return { lines: seedLines };
  }

  const client = getClient();
  const model = process.env.OPENAI_DISPATCH_MODEL?.trim() || "gpt-4o-mini";
  const context = [
    iv.clientName ? `Client : ${iv.clientName}` : null,
    iv.address ? `Adresse : ${iv.address}` : null,
    iv.category ? `Catégorie : ${iv.category}` : null,
    iv.problem ? `Problème : ${iv.problem}` : null,
    iv.title ? `Titre : ${iv.title}` : null,
  ]
    .filter(Boolean)
    .join("\n");

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
    const lines = normalizeLines(Array.isArray(parsed.lines) ? parsed.lines : seedLines);
    if (lines.length === 0) return { lines: seedLines, note: parsed.note };
    return { lines, note: typeof parsed.note === "string" ? parsed.note : undefined };
  } catch {
    return { lines: seedLines };
  }
}

/**
 * Brouillon facture pour validation IVANA (pas de facture PDF tant que non validé).
 * Réutilise les lignes existantes si déjà présentes et cohérentes.
 */
export async function buildDraftBillingPackage(
  iv: Pick<
    Intervention,
    "problem" | "title" | "category" | "address" | "clientName" | "billingLines"
  >,
  opts?: { forceRegenerate?: boolean },
): Promise<DraftBillingPackage> {
  const existing = normalizeLines(
    (Array.isArray(iv.billingLines) ? iv.billingLines : []) as DraftBillingLine[],
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
  const finalLines = lines.length > 0 ? lines : seed;

  return {
    lines: finalLines,
    invoiceAmountCents: totalCentsFromBillingLines(finalLines),
    source: lines.length > 0 && lines !== seed ? "openai" : "template",
    aiNote: note,
  };
}
