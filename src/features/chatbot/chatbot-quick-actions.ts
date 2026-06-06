import type { LecotProductSuggestion } from "@/features/chatbot/chatbot-lecot";

export type ChatbotQuickActionKind = "send_message" | "open_url";

export type ChatbotQuickAction = {
  id: string;
  label: string;
  /** Prix ou sous-titre affiché à droite du bouton (ex. "42 €"). */
  meta?: string;
  kind: ChatbotQuickActionKind;
  /** Texte envoyé comme message utilisateur, ou URL pour open_url. */
  payload: string;
  variant?: "primary" | "secondary" | "outline";
};

function truncateLabel(text: string, max: number): string {
  const t = text.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1)}…`;
}

/** Boutons de commande catalogue Lecot — label court + prix séparé. */
export function buildLecotProductQuickActions(
  suggestions: Pick<LecotProductSuggestion, "rank" | "sku" | "label" | "unitPriceEur">[]
): ChatbotQuickAction[] {
  return suggestions.slice(0, 5).map((s) => ({
    id: `lecot-order-${s.rank}-${s.sku}`,
    label: s.label.trim(),
    meta: s.unitPriceEur > 0 ? `${Math.round(s.unitPriceEur)} €` : undefined,
    kind: "send_message",
    payload: `Commander ${s.sku} — ${s.label}`,
    variant: s.rank === 1 ? "primary" : "secondary",
  }));
}

const LECOT_LINE_RE = /^\s*(\d+)\.\s+.*?\(SKU\s+([A-Z0-9][A-Z0-9-]*)\)/gim;

const LECOT_LINK_RE = /\[([^\]]+)\]\(lecot:([^)]+)\)/g;

export function deriveChatbotQuickActions(
  content: string,
  opts?: { suggestionLabels?: string[] }
): ChatbotQuickAction[] {
  const text = content.trim();

  if (!text) {
    if (opts?.suggestionLabels?.length) {
      return opts.suggestionLabels.slice(0, 6).map((label, i) => ({
        id: `prompt-${i}`,
        label: truncateLabel(label, 40),
        kind: "send_message",
        payload: label,
        variant: i === 0 ? "primary" : "outline",
      }));
    }
    return [];
  }

  if (/catalogue\s+lecot/i.test(text)) {
    const fromLines: ChatbotQuickAction[] = [];
    let m: RegExpExecArray | null;
    const re = new RegExp(LECOT_LINE_RE.source, LECOT_LINE_RE.flags);
    while ((m = re.exec(text)) !== null) {
      const rank = Number(m[1]);
      const sku = m[2];
      const labelMatch = text.slice(m.index, m.index + 200).match(/\[([^\]]+)\]\(lecot:/);
      const label = labelMatch?.[1]?.trim() || sku;
      fromLines.push({
        id: `lecot-derived-${rank}-${sku}`,
        label: label.trim(),
        kind: "send_message",
        payload: `Commander ${sku} — ${label}`,
        variant: rank === 1 ? "primary" : "secondary",
      });
    }
    if (fromLines.length > 0) return fromLines.slice(0, 5);
  }

  if (
    /(?:souhaitez-vous|pourriez-vous|quel(?:le)?\s+(?:produit|pièce|montant|n°|numéro)|répondez|confirmez|commander\s+le\s+n°)/i.test(
      text
    ) &&
    !/catalogue\s+lecot/i.test(text)
  ) {
    const yesNo: ChatbotQuickAction[] = [
      {
        id: "reply-oui",
        label: "Oui",
        kind: "send_message",
        payload: "oui",
        variant: "primary",
      },
      {
        id: "reply-non",
        label: "Non",
        kind: "send_message",
        payload: "non",
        variant: "outline",
      },
    ];
    const rankFooter = text.match(/commander\s+(\d+)/gi);
    if (rankFooter) {
      const ranks = new Set<number>();
      for (const hit of rankFooter) {
        const n = Number(hit.replace(/\D/g, ""));
        if (n >= 1 && n <= 9) ranks.add(n);
      }
      for (const n of [...ranks].sort((a, b) => a - b).slice(0, 3)) {
        yesNo.unshift({
          id: `cmd-rank-${n}`,
          label: `Commander ${n}`,
          kind: "send_message",
          payload: `commander ${n}`,
          variant: "primary",
        });
      }
    }
    return yesNo;
  }

  const links: ChatbotQuickAction[] = [];
  let linkMatch: RegExpExecArray | null;
  const linkRe = new RegExp(LECOT_LINK_RE.source, "g");
  while ((linkMatch = linkRe.exec(text)) !== null && links.length < 3) {
    const label = linkMatch[1].trim();
    const href = linkMatch[2].trim();
    if (href.startsWith("http")) {
      links.push({
        id: `lecot-link-${links.length}`,
        label: truncateLabel(`Voir · ${label}`, 36),
        kind: "open_url",
        payload: href,
        variant: "outline",
      });
    }
  }
  return links;
}

export function mergeQuickActions(
  primary: ChatbotQuickAction[],
  fallback: ChatbotQuickAction[]
): ChatbotQuickAction[] {
  const seen = new Set<string>();
  const out: ChatbotQuickAction[] = [];
  for (const a of [...primary, ...fallback]) {
    if (seen.has(a.id)) continue;
    seen.add(a.id);
    out.push(a);
  }
  return out.slice(0, 8);
}
