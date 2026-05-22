import { MATERIAL_AGENT_CLIENT_NAME_MARKER } from "@/features/featureHub/materialAgentOrderClient";
import { MATERIAL_AGENT_LECOT_DEFAULT_QUERY } from "@/features/featureHub/materialAgentLecotQuery";
import type { CompanyStockAgentIntent } from "@/features/featureHub/companyStockAgentTypes";

export const AWAITING_CLIENT_MESSAGES = [
  { role: "user", content: "Commander CYL-1 — Cylindre" },
  {
    role: "assistant",
    content: `Quel est le nom du client ?\n${MATERIAL_AGENT_CLIENT_NAME_MARKER}`,
  },
] as const;

export type MaterialPhraseCase =
  | { id: string; phrase: string; kind: "in_scope" }
  | { id: string; phrase: string; kind: "out_of_scope" }
  | {
      id: string;
      phrase: string;
      kind: "lecot_catalog";
      /** "default" = requête serrure/cylindre ; sinon mot-clé attendu (contient). */
      query: "default" | string;
      messages?: unknown[];
    }
  | {
      id: string;
      phrase: string;
      kind: "intent";
      intent: CompanyStockAgentIntent;
    }
  | {
      id: string;
      phrase: string;
      kind: "client_name";
      name: string;
      messages?: unknown[];
    }
  | { id: string; phrase: string; kind: "not_client_name"; messages?: unknown[] }
  | { id: string; phrase: string; kind: "reset_client" };

/** ~100 formulations — utilisateurs réels, orthographe et tournures variées. */
export const MATERIAL_AGENT_USER_PHRASES: MaterialPhraseCase[] = [
  // —— Périmètre matériel (35) ——
  { id: "scope-01", phrase: "quelles ruptures de stock ?", kind: "in_scope" },
  { id: "scope-02", phrase: "y'a quoi en rupture", kind: "in_scope" },
  { id: "scope-03", phrase: "montre les alertes stock", kind: "in_scope" },
  { id: "scope-04", phrase: "état du stock stp", kind: "in_scope" },
  { id: "scope-05", phrase: "situation inventaire", kind: "in_scope" },
  { id: "scope-06", phrase: "résumé matériel", kind: "in_scope" },
  { id: "scope-07", phrase: "cherche gâche électrique", kind: "in_scope" },
  { id: "scope-08", phrase: "trouve moi un cylindre", kind: "in_scope" },
  { id: "scope-09", phrase: "référence barillet yale", kind: "in_scope" },
  { id: "scope-10", phrase: "sku serrure multipoints", kind: "in_scope" },
  { id: "scope-11", phrase: "demandes technicien en attente", kind: "in_scope" },
  { id: "scope-12", phrase: "valider les pending", kind: "in_scope" },
  { id: "scope-13", phrase: "commandes terrain à approuver", kind: "in_scope" },
  { id: "scope-14", phrase: "chantiers bloqués matériel", kind: "in_scope" },
  { id: "scope-15", phrase: "waiting material combien", kind: "in_scope" },
  { id: "scope-16", phrase: "autopilot stock", kind: "in_scope" },
  { id: "scope-17", phrase: "régler le stock automatiquement", kind: "in_scope" },
  { id: "scope-18", phrase: "bonjour", kind: "in_scope" },
  { id: "scope-19", phrase: "aide", kind: "in_scope" },
  { id: "scope-20", phrase: "que peux-tu faire", kind: "in_scope" },
  { id: "scope-21", phrase: "besoin de pièces", kind: "in_scope" },
  { id: "scope-22", phrase: "qu'est-ce qui manque en stock", kind: "in_scope" },
  { id: "scope-23", phrase: "articles sous seuil", kind: "in_scope" },
  { id: "scope-24", phrase: "stock bas sur serrures", kind: "in_scope" },
  { id: "scope-25", phrase: "liste fournisseur ouvert", kind: "in_scope" },
  { id: "scope-26", phrase: "commande matériel en cours", kind: "in_scope" },
  { id: "scope-27", phrase: "commande Lecot", kind: "in_scope" },
  { id: "scope-28", phrase: "catalogue fournisseur", kind: "in_scope" },
  { id: "scope-29", phrase: "ajouter article stock", kind: "in_scope" },
  { id: "scope-30", phrase: "nouvelle réf inventaire", kind: "in_scope" },
  { id: "scope-31", phrase: "combien de refs en alerte", kind: "in_scope" },
  { id: "scope-32", phrase: "probleme urgent stock", kind: "in_scope" },
  { id: "scope-33", phrase: "priorité ruptures", kind: "in_scope" },
  { id: "scope-34", phrase: "vue d'ensemble stock", kind: "in_scope" },
  { id: "scope-35", phrase: "couverture inventaire", kind: "in_scope" },

  // —— Hors périmètre (20) ——
  { id: "off-01", phrase: "envoie la facture par email", kind: "out_of_scope" },
  { id: "off-02", phrase: "modifier le devis client", kind: "out_of_scope" },
  { id: "off-03", phrase: "assigne un technicien demain", kind: "out_of_scope" },
  { id: "off-04", phrase: "planning de Jean", kind: "out_of_scope" },
  { id: "off-05", phrase: "répondre au mail gmail", kind: "out_of_scope" },
  { id: "off-06", phrase: "boîte mail non lus", kind: "out_of_scope" },
  { id: "off-07", phrase: "carte missions", kind: "out_of_scope" },
  { id: "off-08", phrase: "itinéraire technicien", kind: "out_of_scope" },
  { id: "off-09", phrase: "chat portail client", kind: "out_of_scope" },
  { id: "off-10", phrase: "statistiques CA du mois", kind: "out_of_scope" },
  { id: "off-11", phrase: "historique crm dupont", kind: "out_of_scope" },
  { id: "off-12", phrase: "quelle est la facture du client ?", kind: "out_of_scope" },
  { id: "off-13", phrase: "encaissement stripe", kind: "out_of_scope" },
  { id: "off-14", phrase: "créneau rdv intervention", kind: "out_of_scope" },
  { id: "off-15", phrase: "navigation mapbox", kind: "out_of_scope" },
  { id: "off-16", phrase: "ouvrir le dossier client dupont", kind: "out_of_scope" },
  { id: "off-17", phrase: "kpi global société", kind: "out_of_scope" },
  { id: "off-18", phrase: "facturation intervention iv-1", kind: "out_of_scope" },
  { id: "off-19", phrase: "paiement en attente", kind: "out_of_scope" },
  { id: "off-20", phrase: "demande client ivana", kind: "out_of_scope" },

  // —— Catalogue Lecot (défaut serrure/cylindre) (22) ——
  { id: "lecot-d-01", phrase: "commande lecot", kind: "lecot_catalog", query: "default" },
  { id: "lecot-d-02", phrase: "COMMANDE LECOT", kind: "lecot_catalog", query: "default" },
  { id: "lecot-d-03", phrase: "nouvelle commande lecot", kind: "lecot_catalog", query: "default" },
  { id: "lecot-d-04", phrase: "je veux commander chez lecot", kind: "lecot_catalog", query: "default" },
  { id: "lecot-d-05", phrase: "catalogue lecot stp", kind: "lecot_catalog", query: "default" },
  { id: "lecot-d-06", phrase: "montre le catalogue fournisseur", kind: "lecot_catalog", query: "default" },
  { id: "lecot-d-07", phrase: "suggère des produits", kind: "lecot_catalog", query: "default" },
  { id: "lecot-d-08", phrase: "propose des articles lecot", kind: "lecot_catalog", query: "default" },
  { id: "lecot-d-09", phrase: "liste références lecot", kind: "lecot_catalog", query: "default" },
  { id: "lecot-d-10", phrase: "commande matériel lecot", kind: "lecot_catalog", query: "default" },
  { id: "lecot-d-11", phrase: "commander via lecot", kind: "lecot_catalog", query: "default" },
  { id: "lecot-d-12", phrase: "besoin d'une commande fournisseur", kind: "lecot_catalog", query: "default" },
  { id: "lecot-d-13", phrase: "lecot", kind: "lecot_catalog", query: "default" },
  { id: "lecot-d-14", phrase: "chez lecot", kind: "lecot_catalog", query: "default" },
  { id: "lecot-d-15", phrase: "fais une commande lecot", kind: "lecot_catalog", query: "default" },
  { id: "lecot-d-16", phrase: "on commande chez lecot ?", kind: "lecot_catalog", query: "default" },
  { id: "lecot-d-17", phrase: "catalogue lecot serrurerie", kind: "lecot_catalog", query: "serrure" },
  {
    id: "lecot-d-18",
    phrase: "oui",
    kind: "lecot_catalog",
    query: "serrure",
    messages: [
      { role: "user", content: "commande lecot" },
      { role: "user", content: "une serrure" },
      { role: "user", content: "oui" },
    ],
  },
  {
    id: "lecot-d-19",
    phrase: "une serrure",
    kind: "lecot_catalog",
    query: "serrure",
    messages: [{ role: "user", content: "commande lecot" }],
  },
  {
    id: "lecot-d-20",
    phrase: "le cylindre",
    kind: "lecot_catalog",
    query: "cylindre",
    messages: [{ role: "user", content: "catalogue lecot" }],
  },
  { id: "lecot-d-21", phrase: "commande matériel", kind: "lecot_catalog", query: "default" },
  { id: "lecot-d-22", phrase: "commande pièce lecot", kind: "lecot_catalog", query: "default" },

  // —— Catalogue Lecot (mot-clé produit) (13) ——
  { id: "lecot-k-01", phrase: "commander une perceuse lecot", kind: "lecot_catalog", query: "perceuse" },
  { id: "lecot-k-02", phrase: "serrure lecot pour client", kind: "lecot_catalog", query: "serrure" },
  { id: "lecot-k-03", phrase: "je cherche un cylindre chez lecot", kind: "lecot_catalog", query: "cylindre" },
  { id: "lecot-k-04", phrase: "verrou lecot", kind: "lecot_catalog", query: "verrou" },
  { id: "lecot-k-05", phrase: "poignée sur lecot", kind: "lecot_catalog", query: "poignée" },
  { id: "lecot-k-06", phrase: "barillet yale lecot", kind: "lecot_catalog", query: "cylindre" },
  { id: "lecot-k-07", phrase: "gâche électrique lecot", kind: "lecot_catalog", query: "gâche" },
  {
    id: "lecot-k-08",
    phrase: "tu peux commander pour le client vatsaev une serrure sur lecot",
    kind: "lecot_catalog",
    query: "serrure",
  },
  { id: "lecot-k-09", phrase: "propose 5 serrures pour lecot", kind: "lecot_catalog", query: "serrure" },
  { id: "lecot-k-10", phrase: "recherche cylindre euro profil", kind: "lecot_catalog", query: "cylindre" },
  { id: "lecot-k-11", phrase: "commander des visseuses lecot", kind: "lecot_catalog", query: "perceuse" },
  { id: "lecot-k-12", phrase: "besoin verrou multipoints lecot", kind: "lecot_catalog", query: "verrou" },
  { id: "lecot-k-13", phrase: "serrures lecot", kind: "lecot_catalog", query: "serrure" },

  // —— Intent local (12) ——
  { id: "int-01", phrase: "ruptures", kind: "intent", intent: "list_out" },
  { id: "int-02", phrase: "plus en stock sur CYL-1", kind: "intent", intent: "list_out" },
  { id: "int-03", phrase: "stock bas", kind: "intent", intent: "list_low" },
  { id: "int-04", phrase: "articles sous seuil", kind: "intent", intent: "list_low" },
  { id: "int-05", phrase: "alertes stock", kind: "intent", intent: "list_alerts" },
  { id: "int-06", phrase: "état du stock", kind: "intent", intent: "summary" },
  { id: "int-07", phrase: "vue d'ensemble", kind: "intent", intent: "summary" },
  { id: "int-08", phrase: "commande lecot", kind: "intent", intent: "lecot" },
  { id: "int-09", phrase: "autopilot", kind: "intent", intent: "autopilot" },
  { id: "int-10", phrase: "demandes en attente", kind: "intent", intent: "pending_orders" },
  { id: "int-11", phrase: "chantiers waiting material", kind: "intent", intent: "waiting_jobs" },
  { id: "int-12", phrase: "cherche cylindre euro", kind: "intent", intent: "search" },

  // —— Nom client (réponse à la question) (12) ——
  { id: "cli-01", phrase: "Dupont", kind: "client_name", name: "Dupont", messages: [...AWAITING_CLIENT_MESSAGES] },
  { id: "cli-02", phrase: "Martin SPRL", kind: "client_name", name: "Martin SPRL", messages: [...AWAITING_CLIENT_MESSAGES] },
  { id: "cli-03", phrase: "Jean Dupont", kind: "client_name", name: "Jean Dupont", messages: [...AWAITING_CLIENT_MESSAGES] },
  { id: "cli-04", phrase: "client Martin", kind: "client_name", name: "Martin", messages: [...AWAITING_CLIENT_MESSAGES] },
  { id: "cli-05", phrase: "nom : Vatsaev", kind: "client_name", name: "Vatsaev", messages: [...AWAITING_CLIENT_MESSAGES] },
  { id: "cli-06", phrase: "nom du client: Lambot", kind: "client_name", name: "Lambot", messages: [...AWAITING_CLIENT_MESSAGES] },
  { id: "cli-07", phrase: "M. Peeters", kind: "client_name", name: "M. Peeters", messages: [...AWAITING_CLIENT_MESSAGES] },
  { id: "cli-08", phrase: "SARL Dubois", kind: "client_name", name: "SARL Dubois", messages: [...AWAITING_CLIENT_MESSAGES] },
  { id: "cli-09", phrase: "client: Anne-Marie", kind: "client_name", name: "Anne-Marie", messages: [...AWAITING_CLIENT_MESSAGES] },
  { id: "cli-10", phrase: "O'Connor", kind: "client_name", name: "O'Connor", messages: [...AWAITING_CLIENT_MESSAGES] },

  // —— Pas un nom client (8) ——
  {
    id: "nocli-01",
    phrase: "nouvelle commande lecot",
    kind: "not_client_name",
    messages: [...AWAITING_CLIENT_MESSAGES],
  },
  {
    id: "nocli-02",
    phrase: "commande lecot",
    kind: "not_client_name",
    messages: [...AWAITING_CLIENT_MESSAGES],
  },
  {
    id: "nocli-03",
    phrase: "catalogue lecot",
    kind: "not_client_name",
    messages: [...AWAITING_CLIENT_MESSAGES],
  },
  { id: "nocli-04", phrase: "Commander 2", kind: "not_client_name", messages: [...AWAITING_CLIENT_MESSAGES] },
  { id: "nocli-05", phrase: "ruptures stock", kind: "not_client_name", messages: [...AWAITING_CLIENT_MESSAGES] },

  // —— Reset session client (5) ——
  { id: "rst-01", phrase: "nouvelle commande lecot", kind: "reset_client" },
  { id: "rst-02", phrase: "autre client", kind: "reset_client" },
  { id: "rst-03", phrase: "changer de client", kind: "reset_client" },
  { id: "rst-04", phrase: "nouveau client", kind: "reset_client" },
  { id: "rst-05", phrase: "catalogue", kind: "reset_client" },
];

export function expectedLecotQuery(query: MaterialPhraseCase & { kind: "lecot_catalog" }): string {
  return query.query === "default" ? MATERIAL_AGENT_LECOT_DEFAULT_QUERY : query.query;
}

export function assertLecotQueryMatches(
  actual: string | null,
  expected: MaterialPhraseCase & { kind: "lecot_catalog" },
): void {
  const want = expectedLecotQuery(expected);
  if (expected.query === "default") {
    expect(actual).toBe(want);
    return;
  }
  expect(actual).not.toBeNull();
  expect(actual!.toLowerCase()).toContain(expected.query.toLowerCase());
}
