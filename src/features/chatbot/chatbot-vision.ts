import OpenAI from "openai";

export interface EquipmentDiagnosis {
  equipmentType: string | null;
  equipmentMake: string | null;
  equipmentModel: string | null;
  serialNumber: string | null;
  yearEstimate: string | null;
  failureModes: string[];
  repairSteps: string[];
  partsToOrder: string[];
  safetyWarnings: string[];
  confidence: "high" | "medium" | "low";
  rawSummary: string;
}

const VISION_SYSTEM_PROMPT = `Tu es un expert technique en serrurerie, plomberie, électricité et HVAC.
Analyse la photo fournie et retourne UNIQUEMENT un JSON valide avec cette structure exacte :
{
  "equipmentType": "type d'équipement (ex: serrure, chaudière, tableau électrique)",
  "equipmentMake": "marque (null si non visible)",
  "equipmentModel": "modèle (null si non visible)",
  "serialNumber": "numéro de série (null si non visible)",
  "yearEstimate": "année approximative ou plage (null si inconnu)",
  "failureModes": ["défaillance probable 1", "défaillance probable 2"],
  "repairSteps": ["étape 1", "étape 2", "étape 3"],
  "partsToOrder": ["pièce 1 (référence si visible)", "pièce 2"],
  "safetyWarnings": ["avertissement sécurité si applicable"],
  "confidence": "high|medium|low",
  "rawSummary": "résumé en 2 phrases de ce qui est visible"
}
Sois précis et concis. Ne génère rien d'autre que ce JSON.`;

export async function diagnoseEquipmentPhoto(params: {
  photoUrl: string;
  description?: string;
  apiKey: string;
  modelName?: string;
}): Promise<EquipmentDiagnosis> {
  const client = new OpenAI({ apiKey: params.apiKey });

  const userContent: OpenAI.ChatCompletionContentPart[] = [
    {
      type: "image_url",
      image_url: { url: params.photoUrl, detail: "high" },
    },
  ];

  if (params.description?.trim()) {
    userContent.push({
      type: "text",
      text: `Description du technicien : ${params.description.trim()}`,
    });
  }

  const response = await client.chat.completions.create({
    model: params.modelName ?? "gpt-4o-mini",
    max_tokens: 800,
    messages: [
      { role: "system", content: VISION_SYSTEM_PROMPT },
      { role: "user", content: userContent },
    ],
  });

  const raw = response.choices[0]?.message?.content?.trim() ?? "{}";

  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  const parsed = JSON.parse(jsonMatch?.[0] ?? "{}") as Partial<EquipmentDiagnosis>;

  return {
    equipmentType: parsed.equipmentType ?? null,
    equipmentMake: parsed.equipmentMake ?? null,
    equipmentModel: parsed.equipmentModel ?? null,
    serialNumber: parsed.serialNumber ?? null,
    yearEstimate: parsed.yearEstimate ?? null,
    failureModes: Array.isArray(parsed.failureModes) ? parsed.failureModes : [],
    repairSteps: Array.isArray(parsed.repairSteps) ? parsed.repairSteps : [],
    partsToOrder: Array.isArray(parsed.partsToOrder) ? parsed.partsToOrder : [],
    safetyWarnings: Array.isArray(parsed.safetyWarnings) ? parsed.safetyWarnings : [],
    confidence: parsed.confidence ?? "low",
    rawSummary: parsed.rawSummary ?? raw,
  };
}
