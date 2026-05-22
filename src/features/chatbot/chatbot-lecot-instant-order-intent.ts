/** Détection commande Lecot instantanée — sans dépendance serveur (utilisable côté client). */

const COMMANDER_SKU_LABEL_RE =
  /^commander\s+([A-Z0-9][A-Z0-9-]*)\s*[—–-]\s*(.+)$/i;
const COMMANDER_RANK_RE = /^commander\s+(\d{1,2})\s*\.?\s*$/i;

export type LecotInstantOrderIntent =
  | { kind: "sku"; sku: string; label: string }
  | { kind: "rank"; rank: number };

/** Message utilisateur déclenchant une commande directe (bouton ou « Commander N »). */
export function parseLecotInstantOrderIntent(lastUserText: string): LecotInstantOrderIntent | null {
  const t = lastUserText.trim();
  if (!t) return null;

  const skuLabel = COMMANDER_SKU_LABEL_RE.exec(t);
  if (skuLabel) {
    return {
      kind: "sku",
      sku: skuLabel[1].trim().toUpperCase(),
      label: skuLabel[2].trim(),
    };
  }

  const rank = COMMANDER_RANK_RE.exec(t);
  if (rank) {
    const n = Number(rank[1]);
    if (n >= 1 && n <= 9) return { kind: "rank", rank: n };
  }

  return null;
}
