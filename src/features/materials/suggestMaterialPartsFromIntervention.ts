import {
  TERRAIN_TEMPLATES,
  type TerrainTemplate,
} from "@/features/interventions/config/terrainTemplates";
import type { MaterialOrderPart } from "@/features/materials/types";
import type { Intervention } from "@/features/interventions/types";

export type MaterialPartSuggestion = MaterialOrderPart & {
  sourceTemplateId: string;
};

type InterventionContext = Pick<Intervention, "problem" | "title" | "transcription" | "category">;

const NON_PART_PATTERN =
  /main d.?oeuvre|deplacement|diagnostic|forfait|mise en service|ancrage|installation coffre/i;

const KEYWORD_TEMPLATE_BOOSTS: Array<{ pattern: RegExp; templateId: string; boost: number }> = [
  {
    pattern: /effrac|cambriol|forc|pied-de-biche|vandal/,
    templateId: "ouverture-forcee",
    boost: 12,
  },
  {
    pattern: /claqu|bloqu|ferm.*cle|cle.*perdu|ouvertur/,
    templateId: "ouverture-porte",
    boost: 10,
  },
  {
    pattern: /multipoint|3\s*point|trois\s*point|92\s*\/?\s*40/,
    templateId: "multipoint-92-40",
    boost: 12,
  },
  { pattern: /multipoint|5\s*point|cinq\s*point/, templateId: "multipoint-standard", boost: 10 },
  { pattern: /cylindr|barillet|europ[eé]en/, templateId: "remplacement-cylindre", boost: 12 },
  {
    pattern: /serrure|poign[eé]e|gâche|gache|verrou/,
    templateId: "remplacement-serrure-complete",
    boost: 8,
  },
  { pattern: /vitr|cass|fen[eê]tre|double\s*vitr/, templateId: "vitre-simple", boost: 12 },
];

function normalize(text: string): string {
  return text.toLowerCase().normalize("NFD").replace(/\p{M}/gu, "");
}

function readInterventionHaystack(iv: InterventionContext): string {
  return normalize([iv.problem, iv.title, iv.transcription, iv.category].filter(Boolean).join(" "));
}

function resolveTemplateCategory(
  category: Intervention["category"] | undefined
): TerrainTemplate["category"] {
  if (category === "serrurerie") return "serrurerie";
  return "general";
}

function isPhysicalPart(description: string): boolean {
  const n = normalize(description);
  if (!n.trim()) return false;
  return !NON_PART_PATTERN.test(n);
}

function scoreTemplate(
  tpl: TerrainTemplate,
  hay: string,
  preferredCategory: TerrainTemplate["category"]
): number {
  let score = 0;
  const name = normalize(tpl.name);
  if (hay.includes(name)) score += 8;

  for (const line of tpl.lines) {
    const desc = normalize(line.description);
    const tokens = desc.split(/[\s/()-]+/).filter((w) => w.length > 4);
    for (const token of tokens) {
      if (hay.includes(token)) score += 2;
    }
  }

  for (const { pattern, templateId, boost } of KEYWORD_TEMPLATE_BOOSTS) {
    if (tpl.id === templateId && pattern.test(hay)) score += boost;
  }

  if (tpl.category === preferredCategory) score += 3;
  else if (tpl.category === "general") score += 1;
  else score -= 1;

  return score;
}

function partsFromTemplate(tpl: TerrainTemplate): MaterialOrderPart[] {
  return tpl.lines
    .filter((line) => isPhysicalPart(line.description))
    .map((line) => ({
      description: line.description,
      quantity: line.quantity,
      reference: line.reference ?? "",
    }));
}

/** Jusqu'à 3 pièces physiques probables — templates terrain + mots-clés client. */
export function suggestMaterialPartsFromIntervention(
  iv: InterventionContext,
  limit = 3
): MaterialPartSuggestion[] {
  const hay = readInterventionHaystack(iv);
  if (!hay.trim()) return [];

  const preferredCategory = resolveTemplateCategory(iv.category ?? undefined);
  const ranked = [...TERRAIN_TEMPLATES]
    .map((tpl) => ({ tpl, score: scoreTemplate(tpl, hay, preferredCategory) }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score);

  const pool: MaterialPartSuggestion[] = [];
  const seen = new Set<string>();

  const pushFromTemplate = (tpl: TerrainTemplate) => {
    for (const part of partsFromTemplate(tpl)) {
      const key = normalize(part.description);
      if (seen.has(key)) continue;
      seen.add(key);
      pool.push({ ...part, sourceTemplateId: tpl.id });
      if (pool.length >= limit) return;
    }
  };

  for (const { tpl } of ranked) {
    if (pool.length >= limit) break;
    if (partsFromTemplate(tpl).length === 0) continue;
    pushFromTemplate(tpl);
  }

  if (pool.length < limit) {
    const fallbackId =
      ranked.find(({ tpl }) => partsFromTemplate(tpl).length > 0)?.tpl.id ??
      "remplacement-cylindre";
    const fallback = TERRAIN_TEMPLATES.find((t) => t.id === fallbackId);
    if (fallback) pushFromTemplate(fallback);
  }

  return pool.slice(0, limit);
}
