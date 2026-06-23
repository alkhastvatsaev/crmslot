import type { StockItem } from "@/features/materials";

export type StockCategoryId = "cylinder" | "lock" | "key" | "hardware" | "consumable" | "other";

const RULES: { id: StockCategoryId; pattern: RegExp }[] = [
  { id: "cylinder", pattern: /cylindre|barillet|profil|euro|pompe|bille/i },
  { id: "lock", pattern: /serrure|gache|gâche|pene|pêne|verrou|crémone|cremone|multipoint/i },
  { id: "key", pattern: /cl[eé]|clef|badge|transpondeur|télécommande|telecommande|rfid/i },
  {
    id: "hardware",
    pattern: /vis|boulon|gond|charnière|charniere|paumelle|butée|butee|quincailler/i,
  },
  { id: "consumable", pattern: /joint|lubrif|colle|mousse|abrasif|gant|nettoy/i },
];

export function inferStockCategory(item: StockItem): StockCategoryId {
  const hay = `${item.reference} ${item.description}`.toLowerCase();
  for (const rule of RULES) {
    if (rule.pattern.test(hay)) return rule.id;
  }
  return "other";
}

export const STOCK_CATEGORY_ORDER: StockCategoryId[] = [
  "cylinder",
  "lock",
  "key",
  "hardware",
  "consumable",
  "other",
];
