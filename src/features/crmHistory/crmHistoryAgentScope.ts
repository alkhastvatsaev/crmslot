const CRM_PATTERNS: { re: RegExp; weight: number }[] = [
  { re: /historique|activité|activite|crm|timeline|événement|evenement/i, weight: 3 },
  { re: /intervention|dossier|client|technicien|chantier/i, weight: 2 },
  { re: /email|mail|courriel|communication|ivana|portail/i, weight: 2 },
  { re: /commande|matériel|materiel|fournisseur|lecot/i, weight: 2 },
  { re: /résumé|resume|synthèse|synthese|semaine|mois|aujourd'hui/i, weight: 2 },
  { re: /statistique|performance|kpi|combien/i, weight: 2 },
];

const OFF_TOPIC_PATTERNS: { re: RegExp; weight: number }[] = [
  { re: /facture|devis|facturation|billing|paiement|encaissement|stripe/i, weight: 4 },
  { re: /stock|inventaire|rupture|sku|référence stock/i, weight: 4 },
  { re: /gmail|boîte\s+mail|colis|tracking/i, weight: 4 },
  { re: /planning|assigner?\s+.*technicien|créneau|rdv/i, weight: 3 },
  { re: /carte|mapbox|itinéraire/i, weight: 3 },
];

const GREETING_RE =
  /^(?:bonjour|salut|hello|coucou|bonsoir|hey|merci|ok|ça va|ca va)(?:\s*[!?.]*)?$/i;

const HELP_RE = /aide|help|\?|que\s+peux|qu'?est-ce\s+que\s+tu|comment\s+(?:ça\s+)?marche/i;

export function isCrmHistoryAgentInScope(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed) return true;
  if (GREETING_RE.test(trimmed) || HELP_RE.test(trimmed)) return true;

  let crm = 0;
  let offTopic = 0;
  for (const p of CRM_PATTERNS) {
    if (p.re.test(trimmed)) crm += p.weight;
  }
  for (const p of OFF_TOPIC_PATTERNS) {
    if (p.re.test(trimmed)) offTopic += p.weight;
  }

  if (offTopic >= 4 && crm === 0) return false;
  if (offTopic >= 3 && crm <= 1) return false;
  if (crm >= 2) return true;
  if (offTopic >= 2 && crm === 0) return false;
  if (trimmed.length < 50 && offTopic === 0) return true;
  return crm > offTopic;
}
