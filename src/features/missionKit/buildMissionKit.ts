import type {
  BuildMissionKitInput,
  MissionKit,
  MissionKitItem,
  MissionKitItemSource,
} from "@/features/missionKit/types";
import {
  buildHistoricalHint,
  extractHistoricalPatternItems,
  historicalPatternsToMissionKitItems,
  rankSimilarCompletedInterventions,
} from "@/features/missionKit/missionKitHistoricalPatterns";
import { matchMissionKitToLecot } from "@/features/missionKit/matchMissionKitToLecot";
import { matchMissionKitToStock } from "@/features/missionKit/matchMissionKitToStock";

type HeuristicRule = {
  pattern: RegExp;
  items: Array<{ id: string; label: string; reference?: string; quantity?: number }>;
  confidence: number;
};

const LOCKSMITH_RULES: HeuristicRule[] = [
  {
    pattern: /\b(cylindre|barillet)\b/i,
    items: [
      { id: "cyl-euro", label: "Cylindre européen 30/35", reference: "CYL-EURO-3035", quantity: 1 },
      { id: "scie-cloche", label: "Scie-cloche métal", quantity: 1 },
    ],
    confidence: 0.85,
  },
  {
    pattern: /\b(porte\s*blind[ée]e|blindage)\b/i,
    items: [
      { id: "serr-3pt", label: "Serrure 3 points", reference: "SERR-3PT", quantity: 1 },
      { id: "foret-metal", label: "Forets métal HSS", quantity: 1 },
      { id: "gache-12v", label: "Gâche électrique 12V", reference: "GACHE-12V", quantity: 1 },
    ],
    confidence: 0.8,
  },
  {
    pattern: /\b(g[aâ]che|gache)\b/i,
    items: [
      { id: "gache-12v", label: "Gâche électrique 12V", reference: "GACHE-12V", quantity: 1 },
    ],
    confidence: 0.75,
  },
  {
    pattern: /\b(poign[ée]e|poignee)\b/i,
    items: [{ id: "poignee-secu", label: "Poignée de sécurité", quantity: 1 }],
    confidence: 0.7,
  },
  {
    pattern: /\b(serrure|verrou|cl[ée])\b/i,
    items: [
      { id: "jeu-crochets", label: "Jeu de crochets / outils ouverture", quantity: 1 },
      { id: "lubrifiant", label: "Lubrifiant serrure", quantity: 1 },
    ],
    confidence: 0.65,
  },
  {
    pattern: /\b(porte\s*bloqu[ée]e|bloqu[ée]e|coinc[ée]e)\b/i,
    items: [
      { id: "jeu-crochets", label: "Jeu de crochets / outils ouverture", quantity: 1 },
      { id: "pied-biche", label: "Pied-de-biche", quantity: 1 },
    ],
    confidence: 0.6,
  },
];

const BASE_TOOLKIT: MissionKitItem[] = [
  {
    id: "tournevis-cruciforme",
    label: "Tournevis cruciforme",
    quantity: 1,
    source: "heuristic",
    status: "unknown",
    confidence: 0.5,
  },
  {
    id: "perceuse",
    label: "Perceuse + batteries",
    quantity: 1,
    source: "heuristic",
    status: "unknown",
    confidence: 0.5,
  },
];

function problemText(input: BuildMissionKitInput): string {
  const problem = (input.problem ?? "").trim();
  if (problem) return problem;
  return (input.title ?? "").trim();
}

function slugId(label: string): string {
  return label
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

function toItem(
  spec: { id: string; label: string; reference?: string; quantity?: number },
  source: MissionKitItemSource,
  confidence: number
): MissionKitItem {
  return {
    id: spec.id,
    label: spec.label,
    reference: spec.reference,
    quantity: spec.quantity ?? 1,
    source,
    status: "unknown",
    lecotSku: spec.reference,
    confidence,
  };
}

function mergeItems(items: MissionKitItem[]): MissionKitItem[] {
  const byId = new Map<string, MissionKitItem>();
  for (const item of items) {
    const existing = byId.get(item.id);
    if (!existing) {
      byId.set(item.id, item);
      continue;
    }
    byId.set(item.id, {
      ...existing,
      quantity: Math.max(existing.quantity, item.quantity),
      confidence: Math.max(existing.confidence, item.confidence),
      reference: existing.reference ?? item.reference,
      lecotSku: existing.lecotSku ?? item.lecotSku,
    });
  }
  return [...byId.values()].sort((a, b) => b.confidence - a.confidence);
}

/**
 * Génère un kit mission heuristique (sans IA ni stock) à partir de la description.
 */
export function buildMissionKit(input: BuildMissionKitInput): MissionKit {
  const text = problemText(input);
  const normalized = text.toLowerCase();
  const isLocksmith = input.category === "serrurerie" || /\bserrur/i.test(normalized);

  const matched: MissionKitItem[] = [];
  for (const rule of LOCKSMITH_RULES) {
    if (!rule.pattern.test(text)) continue;
    const boost = isLocksmith ? 0.05 : 0;
    for (const spec of rule.items) {
      matched.push(toItem(spec, "heuristic", Math.min(1, rule.confidence + boost)));
    }
  }

  const heuristicItems =
    matched.length > 0
      ? mergeItems(matched)
      : isLocksmith
        ? mergeItems([
            toItem(
              { id: "cyl-euro", label: "Cylindre européen 30/35", reference: "CYL-EURO-3035" },
              "heuristic",
              0.45
            ),
            ...BASE_TOOLKIT,
          ])
        : mergeItems([
            toItem(
              {
                id: slugId(text) || "intervention-generique",
                label: text || "Intervention générique",
              },
              "heuristic",
              0.35
            ),
            ...BASE_TOOLKIT,
          ]);

  const rankedPeers = rankSimilarCompletedInterventions(
    {
      id: input.interventionId,
      problem: input.problem,
      title: input.title?.trim() || input.problem?.trim() || "",
    },
    input.peerInterventions ?? []
  );
  const historicalPatterns = extractHistoricalPatternItems(rankedPeers);
  const historicalItems = historicalPatternsToMissionKitItems(historicalPatterns);
  const mergedItems = mergeItems([...historicalItems, ...heuristicItems]);
  const catalogItems = matchMissionKitToLecot(mergedItems, input.catalog);
  const stockResult = matchMissionKitToStock(catalogItems, {
    vehicleStock: input.vehicleStock,
    warehouseStock: input.warehouseStock,
  });
  const items = stockResult.items;
  const historicalHint = buildHistoricalHint(historicalPatterns);

  const summary =
    matched.length > 0
      ? `${items.length} élément(s) suggéré(s) pour : ${text.slice(0, 120)}`
      : isLocksmith
        ? "Kit de base serrurerie — précisez le problème pour affiner."
        : "Kit outillage de base — pièces spécifiques à confirmer sur place.";

  return {
    interventionId: input.interventionId,
    generatedAt: input.generatedAt ?? new Date().toISOString(),
    items,
    summary,
    historicalHint,
    completenessScore: stockResult.completenessScore,
  };
}
