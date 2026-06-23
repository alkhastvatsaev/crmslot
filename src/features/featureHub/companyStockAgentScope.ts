import type { CompanyStockAgentIntent } from "@/features/featureHub/companyStockAgentTypes";

/** Signaux matériel / stock (score positif). */
const MATERIAL_PATTERNS: { re: RegExp; weight: number }[] = [
  { re: /matériel|materiel|stock|inventaire|rupture|seuil|alerte/i, weight: 3 },
  { re: /référence|reference|sku|article|pièce|piece|quantité|quantite|qté|qte/i, weight: 2 },
  { re: /lecot|fournisseur|commander|commande/i, weight: 2 },
  { re: /barillet|cylindre|serrure|gâche|gache|clé|clef|quincailler/i, weight: 2 },
  { re: /demande.*technicien|terrain.*mat/i, weight: 2 },
  { re: /attente\s+matériel|waiting_material|chantier.*mat/i, weight: 2 },
  { re: /autopilot|régler.*stock|regler.*stock/i, weight: 2 },
];

/** Hors périmètre matériel (score négatif fort). */
const OFF_TOPIC_PATTERNS: { re: RegExp; weight: number }[] = [
  { re: /facture|devis|facturation|billing|paiement|stripe|encaissement/i, weight: 4 },
  { re: /email|mail|courriel|gmail|boîte\s+mail/i, weight: 4 },
  { re: /planning|planifier|assigner?\s+.*technicien|créneau|rdv|rendez-vous/i, weight: 4 },
  { re: /carte|mapbox|itinéraire|navigation/i, weight: 4 },
  { re: /chat\s+client|portail\s+client|back.?office|dispatch|demande\s+client/i, weight: 3 },
  { re: /statistique|chiffre\s+d'affaires|\bca\b|kpi\s+global/i, weight: 3 },
  { re: /crm|historique\s+crm/i, weight: 3 },
  { re: /intervention(?!.*mat)|dossier(?!.*mat)|client(?!.*mat)/i, weight: 2 },
];

const GREETING_RE =
  /^(?:bonjour|salut|hello|coucou|bonsoir|hey|merci|ok|ça va|ca va)(?:\s*[!?.]*)?$/i;

const HELP_RE = /aide|help|que\s+peux|qu'?est-ce\s+que\s+tu|comment\s+(?:ça\s+)?marche/i;

export function scoreMaterialRelevance(text: string): { material: number; offTopic: number } {
  const t = text.trim();
  let material = 0;
  let offTopic = 0;
  for (const p of MATERIAL_PATTERNS) {
    if (p.re.test(t)) material += p.weight;
  }
  for (const p of OFF_TOPIC_PATTERNS) {
    if (p.re.test(t)) offTopic += p.weight;
  }
  return { material, offTopic };
}

/** True si le message relève du périmètre agent matériel. */
export function isCompanyStockAgentInScope(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed) return true;
  if (GREETING_RE.test(trimmed) || HELP_RE.test(trimmed)) return true;

  const { material, offTopic } = scoreMaterialRelevance(trimmed);
  if (offTopic >= 4 && material === 0) return false;
  if (offTopic >= 3 && material <= 1) return false;
  if (material >= 2) return true;
  if (offTopic >= 2 && material === 0) return false;

  // Questions courtes ambiguës → rester dans le scope (résumé stock).
  if (trimmed.length < 40 && offTopic === 0) return true;
  return material > offTopic;
}

const INTENT_RULES: { intent: CompanyStockAgentIntent; re: RegExp; priority: number }[] = [
  { intent: "off_topic", re: /^$/, priority: 0 },
  { intent: "greeting", re: GREETING_RE, priority: 10 },
  { intent: "help", re: HELP_RE, priority: 9 },
  {
    intent: "autopilot",
    re: /autopilot|régler\s+(?:le\s+)?stock|regler\s+(?:le\s+)?stock|tout\s+régler/i,
    priority: 8,
  },
  { intent: "lecot", re: /lecot|catalogue\s+fournisseur|commander\s+(?:chez|via)/i, priority: 8 },
  { intent: "add_item", re: /ajouter|créer|creer|nouveau\s+article|nouvelle\s+réf/i, priority: 7 },
  {
    intent: "waiting_jobs",
    re: /chantier|intervention.*attente|waiting_material|attente\s+mat/i,
    priority: 7,
  },
  {
    intent: "pending_orders",
    re: /demandes?|commandes?\s+(?:en\s+attente|terrain)|pending|bons?\s+mat|technicien.*mat|matériel\s+demand/i,
    priority: 7,
  },
  {
    intent: "list_alerts",
    re: /alertes?|problème|probleme|urgent|priorité|priorite/i,
    priority: 6,
  },
  {
    intent: "list_out",
    re: /rupture|épuisé|epuise|plus\s+en\s+stock|qty\s*0|quantité\s*0/i,
    priority: 6,
  },
  { intent: "list_low", re: /stock\s+bas|sous\s+(?:le\s+)?seuil|faible|bas\s+seuil/i, priority: 6 },
  {
    intent: "summary",
    re: /résumé|resume|état|etat|situation|combien|vue\s+d'ensemble|synthèse|synthese|couverture/i,
    priority: 5,
  },
  { intent: "search", re: /.+/i, priority: 1 },
];

export function classifyCompanyStockAgentIntent(
  text: string,
  inScope: boolean
): CompanyStockAgentIntent {
  if (!inScope) return "off_topic";
  const trimmed = text.trim();
  if (!trimmed) return "greeting";

  let best: CompanyStockAgentIntent = "summary";
  let bestPri = 0;
  for (const rule of INTENT_RULES) {
    if (rule.intent === "off_topic") continue;
    if (rule.re.test(trimmed) && rule.priority > bestPri) {
      best = rule.intent;
      bestPri = rule.priority;
    }
  }
  if (best === "search" && bestPri === 1) {
    const { material } = scoreMaterialRelevance(trimmed);
    if (material === 0 && trimmed.split(/\s+/).length <= 3) return "summary";
  }
  return best;
}

export function extractStockSearchQuery(text: string): string {
  return text
    .replace(
      /^(?:cherche|chercher|trouve|trouver|recherche|où\s+est|ou\s+est|affiche|montre|liste)\s+/i,
      ""
    )
    .replace(/^(?:l['']|la|le|les|un|une|des)\s+/i, "")
    .trim();
}
