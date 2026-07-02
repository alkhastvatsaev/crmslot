import OpenAI from "openai";
import { logger } from "@/core/logger";

export type MissionKitPostBody = {
  problem?: string;
  address?: string;
  category?: string;
  photoUrls?: string[];
  existingItems?: Array<{ label: string; reference?: string; quantity: number }>;
};

export type MissionKitRouteResult = {
  items: Array<{ label: string; reference?: string; quantity: number; confidence: number }>;
  summary?: string;
  skipped?: boolean;
};

const SYSTEM_PROMPT = `Tu es un expert serrurerie en Belgique.
On te donne une intervention (problème, adresse) et un kit déjà proposé.
Suggère des pièces/outils COMPLÉMENTAIRES à emporter sur le terrain (pas de doublons avec existingItems).
Réponds UNIQUEMENT en JSON :
{
  "items": [
    { "label": "string", "reference": "string optionnel SKU", "quantity": number, "confidence": number entre 0 et 1 }
  ],
  "summary": "phrase courte optionnelle"
}
Maximum 6 items. Pas de main-d'œuvre ni déplacement.`;

export async function handleMissionKitPost(body: MissionKitPostBody | null): Promise<Response> {
  const problem = (body?.problem ?? "").trim();
  const address = (body?.address ?? "").trim();
  const category = (body?.category ?? "").trim();
  const existingItems = Array.isArray(body?.existingItems) ? body!.existingItems! : [];

  if (!problem && existingItems.length === 0) {
    return Response.json({ error: "problem ou existingItems requis" }, { status: 400 });
  }

  const apiKey = process.env.OPENAI_API_KEY?.trim() || "";
  if (!apiKey) {
    const fallback: MissionKitRouteResult = { items: [], skipped: true };
    return Response.json(fallback);
  }

  try {
    const openai = new OpenAI({ apiKey });
    const model = process.env.OPENAI_DISPATCH_MODEL?.trim() || "gpt-4o-mini";
    const userPrompt = `Catégorie : ${category || "non précisée"}
Problème : ${problem || "non précisé"}
Adresse : ${address || "non précisée"}
Kit déjà proposé :
${JSON.stringify(existingItems, null, 2)}`;

    const response = await openai.chat.completions.create({
      model,
      temperature: 0.15,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
      max_tokens: 400,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      return Response.json({ items: [], skipped: true } satisfies MissionKitRouteResult);
    }

    const parsed = JSON.parse(content) as MissionKitRouteResult;
    const items = Array.isArray(parsed.items)
      ? parsed.items
          .filter((row) => row?.label?.trim())
          .slice(0, 6)
          .map((row) => ({
            label: row.label.trim(),
            reference: row.reference?.trim() || undefined,
            quantity: Math.max(1, Math.round(row.quantity ?? 1)),
            confidence: Math.min(1, Math.max(0.4, Number(row.confidence) || 0.72)),
          }))
      : [];

    return Response.json({
      items,
      summary: parsed.summary?.trim() || undefined,
    } satisfies MissionKitRouteResult);
  } catch (error: unknown) {
    logger.error("[mission-kit]", {
      error: error instanceof Error ? error.message : String(error),
    });
    return Response.json({ items: [], skipped: true } satisfies MissionKitRouteResult);
  }
}
