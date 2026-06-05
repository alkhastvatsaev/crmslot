const BILLING_PATTERNS: { re: RegExp; weight: number }[] = [
  { re: /facture|devis|facturation|billing|paiement|encaissement|impayé|impaye/i, weight: 4 },
  {
    re: /fait\s+(?:une?\s+)?facture|faire\s+(?:une?\s+)?facture|cr[eé][eé]r\s+(?:une?\s+)?facture|facture\s+pour/i,
    weight: 5,
  },
  { re: /montant|€|eur\b|euro|ht\b|ttc|ligne.*facture/i, weight: 3 },
  { re: /client.*facture|dossier.*facture/i, weight: 2 },
  { re: /résumé|resume|encours|à\s+facturer|a\s+facturer/i, weight: 2 },
];

const OFF_TOPIC_PATTERNS: { re: RegExp; weight: number }[] = [
  { re: /stock|inventaire|rupture|lecot|catalogue\s+fournisseur/i, weight: 4 },
  { re: /historique\s+crm|activité\s+crm|timeline\s+globale/i, weight: 4 },
  { re: /gmail|boîte\s+mail|colis/i, weight: 4 },
  { re: /planning|assigner?\s+technicien|créneau/i, weight: 3 },
  { re: /carte|mapbox/i, weight: 3 },
];

const GREETING_RE =
  /^(?:bonjour|salut|hello|coucou|bonsoir|hey|merci|ok|ça va|ca va)(?:\s*[!?.]*)?$/i;

const HELP_RE = /aide|help|que\s+peux|qu'?est-ce\s+que\s+tu|comment\s+(?:ça\s+)?marche/i;

export function isBillingHubAgentInScope(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed) return true;
  if (GREETING_RE.test(trimmed) || HELP_RE.test(trimmed)) return true;

  let billing = 0;
  let offTopic = 0;
  for (const p of BILLING_PATTERNS) {
    if (p.re.test(trimmed)) billing += p.weight;
  }
  for (const p of OFF_TOPIC_PATTERNS) {
    if (p.re.test(trimmed)) offTopic += p.weight;
  }

  if (offTopic >= 4 && billing === 0) return false;
  if (offTopic >= 3 && billing <= 1) return false;
  if (billing >= 2) return true;
  if (offTopic >= 2 && billing === 0) return false;
  if (trimmed.length < 50 && offTopic === 0) return true;
  return billing > offTopic;
}
