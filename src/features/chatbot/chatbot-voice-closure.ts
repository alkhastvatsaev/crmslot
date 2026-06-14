import OpenAI from "openai";

export interface VoiceJobClosureData {
  reportText: string;
  billingLines: { description: string; quantity: number; unitPriceEur: number }[];
  paymentStatus: "cash" | "card" | "invoice" | "pending" | null;
  paymentAmountEur: number | null;
  followUpAction: string | null;
  followUpQuoteNeeded: boolean;
  partsUsed: string[];
  laborHours: number | null;
  clientSatisfied: boolean | null;
  confidence: "high" | "medium" | "low";
}

const SYSTEM_PROMPT = `Tu es un assistant expert en facturation et clôture d'interventions techniques (serrurerie, HVAC, plomberie, électricité).

Analyse la transcription vocale du technicien et extrais les données structurées de clôture de dossier.

Retourne UNIQUEMENT un JSON valide avec cette structure :
{
  "reportText": "résumé professionnel de l'intervention en 2-3 phrases",
  "billingLines": [
    { "description": "libellé pièce ou prestation", "quantity": 1, "unitPriceEur": 0.0 }
  ],
  "paymentStatus": "cash|card|invoice|pending|null",
  "paymentAmountEur": null_ou_montant_numérique,
  "followUpAction": "description de la suite à donner ou null",
  "followUpQuoteNeeded": true_ou_false,
  "partsUsed": ["pièce 1", "pièce 2"],
  "laborHours": null_ou_nombre_décimal,
  "clientSatisfied": true_ou_false_ou_null,
  "confidence": "high|medium|low"
}

Règles :
- Si un prix est mentionné sans TVA, garder le montant tel quel.
- Si "2h de travail" est mentionné, mettre laborHours=2 et une ligne "Main d'œuvre 2h" à 45€/h par défaut.
- Si le client demande un devis pour autre chose → followUpQuoteNeeded=true.
- Ne PAS inventer des montants non mentionnés.`;

export async function parseVoiceJobClosure(params: {
  transcription: string;
  apiKey: string;
  modelName?: string;
}): Promise<VoiceJobClosureData> {
  const client = new OpenAI({ apiKey: params.apiKey });

  const response = await client.chat.completions.create({
    model: params.modelName ?? "gpt-4o-mini",
    max_tokens: 1000,
    temperature: 0.1,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "user",
        content: `Transcription technicien : "${params.transcription.trim()}"`,
      },
    ],
  });

  const raw = response.choices[0]?.message?.content?.trim() ?? "{}";
  const parsed = JSON.parse(raw) as Partial<VoiceJobClosureData>;

  return {
    reportText: parsed.reportText ?? "",
    billingLines: Array.isArray(parsed.billingLines) ? parsed.billingLines : [],
    paymentStatus: parsed.paymentStatus ?? null,
    paymentAmountEur: typeof parsed.paymentAmountEur === "number" ? parsed.paymentAmountEur : null,
    followUpAction: parsed.followUpAction ?? null,
    followUpQuoteNeeded: parsed.followUpQuoteNeeded === true,
    partsUsed: Array.isArray(parsed.partsUsed) ? parsed.partsUsed : [],
    laborHours: typeof parsed.laborHours === "number" ? parsed.laborHours : null,
    clientSatisfied: parsed.clientSatisfied ?? null,
    confidence: parsed.confidence ?? "low",
  };
}
