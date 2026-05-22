/**
 * Simulation 100 utilisateurs — robustesse du chatbot Matériel.
 *
 * Chaque section couvre un type de demande écrit de nombreuses façons différentes.
 * Objectif : même intention = même résultat, quelle que soit la formulation.
 */

import {
  isCompanyStockAgentInScope,
  classifyCompanyStockAgentIntent,
} from "@/features/featureHub/companyStockAgentScope";
import {
  parseMaterialAgentClientNameFromUserText,
  shouldResetMaterialOrderClientSession,
  isMaterialAgentLecotCommandText,
  isAwaitingMaterialAgentClientName,
  MATERIAL_AGENT_CLIENT_NAME_MARKER,
} from "@/features/featureHub/materialAgentOrderClient";
import { resolveLecotCatalogSearchQuery } from "@/features/chatbot/chatbot-lecot-follow-up";

// ─── Helpers ────────────────────────────────────────────────────────────────

function awaitingClientMessages() {
  return [
    { role: "user", content: "commander CYL-01 — Cylindre" },
    {
      role: "assistant",
      content: `Quel est le nom du client ?\n${MATERIAL_AGENT_CLIENT_NAME_MARKER}`,
    },
  ];
}

// ─── 1. Scope IN — questions clairement matériel ────────────────────────────

describe("Scope IN — 40 formulations matériel/stock acceptées", () => {
  const inScope: string[] = [
    // État du stock
    "état du stock",
    "c'est quoi l'état du stock ?",
    "donne moi un résumé du stock",
    "vue d'ensemble inventaire",
    "synthèse stock société",
    "quel est notre stock actuellement",
    "situation inventaire",
    "couverture stock globale",

    // Ruptures
    "ruptures de stock",
    "quelles ruptures ?",
    "articles épuisés",
    "plus en stock",
    "qty à 0",
    "qu'est ce qui manque en stock",
    "articles en rupture",
    "on a quoi qui est épuisé",

    // Alertes / seuils bas
    "alertes stock",
    "articles sous le seuil",
    "stock bas",
    "quoi est en alerte",
    "seuil d'alerte dépassé",
    "articles critiques",
    "stock faible",
    "quoi est urgent en stock",

    // Recherche article
    "cherche cylindre européen",
    "trouve gâche électrique",
    "tu as des serrures ?",
    "barillet en stock ?",
    "références pour cylindre",
    "article CYL-01 disponible ?",
    "combien de barillets on a",
    "stock serrures",

    // Commandes / Lecot
    "commandes en attente",
    "bons matériel pending",
    "demandes terrain pas encore traitées",
    "fournisseur lecot",
    "catalogue lecot",
    "commander chez lecot",
    "valider les demandes matériel",
    "approuver commandes technicien",
  ];

  inScope.forEach((text) => {
    it(`accepte : "${text}"`, () => {
      expect(isCompanyStockAgentInScope(text)).toBe(true);
    });
  });
});

// ─── 2. Scope OUT — questions hors périmètre ────────────────────────────────

describe("Scope OUT — 20 formulations hors périmètre rejetées", () => {
  const outScope: string[] = [
    // Facturation
    "envoie la facture par email",
    "génère un devis",
    "facturation du client Dupont",
    "stripe paiement",
    "encaissement en attente",

    // Email / Gmail
    "lis mes emails",
    "réponds au mail de Martin",
    "boîte mail gmail",
    "email non lu",

    // Planning
    "assigne un technicien demain",
    "planning de la semaine",
    "créneau pour intervention",
    "rendez-vous technicien",

    // Carte / navigation
    "montre sur la carte",
    "itinéraire du technicien",
    "navigation Mapbox",

    // CRM / stats globales
    "chiffre d'affaires du mois",
    "KPI global",
    "statistiques société",
    "historique CRM client",
    "chat portail client",
  ];

  outScope.forEach((text) => {
    it(`rejette : "${text}"`, () => {
      expect(isCompanyStockAgentInScope(text)).toBe(false);
    });
  });
});

// ─── 3. Salutations et aide — toujours acceptées ────────────────────────────

describe("Salutations & aide — toujours in-scope", () => {
  const greetings = [
    "bonjour",
    "salut",
    "hello",
    "hey",
    "bonsoir",
    "merci",
    "ok",
    "aide",
    "help",
    "que peux-tu faire",
    "comment ça marche",
    "qu'est-ce que tu peux faire",
  ];

  greetings.forEach((text) => {
    it(`accepte la salutation : "${text}"`, () => {
      expect(isCompanyStockAgentInScope(text)).toBe(true);
    });
  });
});

// ─── 4. Parsing du nom client — 20 noms valides ─────────────────────────────

describe("Parsing nom client — 20 formulations valides (quand en attente)", () => {
  const msgs = awaitingClientMessages();

  const validNames: { input: string; expected: string }[] = [
    { input: "Dupont", expected: "Dupont" },
    { input: "Martin SPRL", expected: "Martin SPRL" },
    { input: "Jean-Paul", expected: "Jean-Paul" },
    { input: "client: Dupont", expected: "Dupont" },
    { input: "client Dupont", expected: "Dupont" },
    { input: "nom: Martin", expected: "Martin" },
    { input: "nom du client: Société ABC", expected: "Société ABC" },
    { input: "c'est pour Durand", expected: "Durand" },
    { input: "Ahmed", expected: "Ahmed" },
    { input: "De Smedt", expected: "De Smedt" },
    { input: "Verhaegen SA", expected: "Verhaegen SA" },
    { input: "client: Van Den Berg", expected: "Van Den Berg" },
    { input: "Lopez", expected: "Lopez" },
    { input: "Müller GmbH", expected: "Müller GmbH" },
    { input: "D'Artagnan", expected: "D'Artagnan" },
    { input: "Société Lebrun", expected: "Société Lebrun" },
    { input: "nom — Petit", expected: "Petit" },
    { input: "DUPONT", expected: "DUPONT" },
    { input: "Marie-Claire", expected: "Marie-Claire" },
    { input: "client: O'Brien", expected: "O'Brien" },
  ];

  validNames.forEach(({ input, expected }) => {
    it(`parse "${input}" → "${expected}"`, () => {
      const result = parseMaterialAgentClientNameFromUserText(input, msgs);
      expect(result).toBe(expected);
    });
  });
});

// ─── 5. Parsing du nom client — 15 phrases rejetées ────────────────────────

describe("Parsing nom client — 15 phrases-commande rejetées", () => {
  const msgs = awaitingClientMessages();

  const rejected: string[] = [
    "nouvelle commande lecot",
    "commande lecot",
    "commander",
    "catalogue",
    "catalogue lecot",
    "lecot",
    "stock",
    "matériel",
    "recherche",
    "rupture",
    "articles",
    "suggère des produits",
    "propose quelque chose",
    "liste les articles",
    "montre le stock",
  ];

  rejected.forEach((text) => {
    it(`rejette comme nom : "${text}"`, () => {
      expect(isMaterialAgentLecotCommandText(text)).toBe(true);
      expect(parseMaterialAgentClientNameFromUserText(text, msgs)).toBeNull();
    });
  });
});

// ─── 6. Reset de session — 10 formulations ──────────────────────────────────

describe("Reset session client — 10 formulations déclenchant le reset", () => {
  const resets: string[] = [
    "nouvelle commande lecot",
    "nouvelle commande",
    "autre client",
    "changer de client",
    "changer client",
    "nouveau client",
    "nouvelle commande pour un autre client",
    "commande fournisseur",
    "catalogue lecot",
    "fournisseur lecot",
  ];

  resets.forEach((text) => {
    it(`reset sur : "${text}"`, () => {
      expect(shouldResetMaterialOrderClientSession(text)).toBe(true);
    });
  });
});

// ─── 7. Pas de reset — commandes directes avec client implicite ─────────────

describe("Pas de reset — commandes directes (client en session préservé)", () => {
  const noReset: string[] = [
    "commander CYL-01 — Cylindre",
    "commander 1",
    "commander 3",
    "état du stock",
    "ruptures",
    "alertes",
    "valider les demandes",
    "Dupont",
    "bonjour",
    "merci",
  ];

  noReset.forEach((text) => {
    it(`préserve session sur : "${text}"`, () => {
      expect(shouldResetMaterialOrderClientSession(text)).toBe(false);
    });
  });
});

// ─── 8. Détection « en attente du nom client » ──────────────────────────────

describe("isAwaitingMaterialAgentClientName — détection correcte", () => {
  it("détecte l'attente quand le dernier message assistant a le marqueur", () => {
    expect(isAwaitingMaterialAgentClientName(awaitingClientMessages())).toBe(true);
  });

  it("ne détecte pas l'attente sans marqueur", () => {
    const msgs = [
      { role: "user", content: "état du stock" },
      { role: "assistant", content: "Voici le résumé du stock." },
    ];
    expect(isAwaitingMaterialAgentClientName(msgs)).toBe(false);
  });

  it("ne détecte plus l'attente une fois l'agent confirmé", () => {
    // Après que l'agent a confirmé le nom, la prochaine question doit repartir de zéro.
    const msgs = [
      ...awaitingClientMessages(),
      { role: "user", content: "Dupont" },
      { role: "assistant", content: "Client enregistré : **Dupont**. Vous pouvez commander." },
    ];
    expect(isAwaitingMaterialAgentClientName(msgs)).toBe(false);
  });
});

// ─── 9. Classification des intentions ───────────────────────────────────────

describe("classifyCompanyStockAgentIntent — intentions correctement classifiées", () => {
  const cases: { text: string; expected: string }[] = [
    { text: "état du stock", expected: "summary" },
    { text: "résumé inventaire", expected: "summary" },
    { text: "vue d'ensemble", expected: "summary" },
    { text: "ruptures", expected: "list_out" },
    { text: "articles épuisés", expected: "list_out" },
    { text: "stock bas", expected: "list_low" },
    { text: "sous le seuil", expected: "list_low" },
    { text: "alertes stock", expected: "list_alerts" },
    { text: "cherche cylindre euro", expected: "search" },
    { text: "catalogue lecot", expected: "lecot" },
    { text: "commander chez lecot", expected: "lecot" },
    { text: "commandes en attente technicien", expected: "pending_orders" },
    { text: "chantiers en attente matériel", expected: "waiting_jobs" },
    { text: "bonjour", expected: "greeting" },
    { text: "aide", expected: "help" },
  ];

  cases.forEach(({ text, expected }) => {
    it(`"${text}" → "${expected}"`, () => {
      expect(classifyCompanyStockAgentIntent(text, true)).toBe(expected);
    });
  });
});

// ─── 10. Régression HELP_RE — le ? seul ne doit pas passer ─────────────────

describe("Régression HELP_RE — questions hors-scope avec ? ne passent pas", () => {
  const offTopicWithQuestionMark: string[] = [
    "quelle est la facture du client ?",
    "tu peux envoyer un email ?",
    "comment assigner un technicien ?",
    "le planning est disponible ?",
  ];

  offTopicWithQuestionMark.forEach((text) => {
    it(`rejette malgré le '?' : "${text}"`, () => {
      expect(isCompanyStockAgentInScope(text)).toBe(false);
    });
  });
});

// ─── 11. Catalogue Lecot — formulations reconnues (OpenAI + search_lecot_products) ─

describe("Catalogue Lecot — formulations reconnues côté agent", () => {
  const lecotPhrases: string[] = [
    "commande lecot",
    "COMMANDE LECOT",
    "nouvelle commande lecot",
    "je veux commander chez lecot",
    "catalogue lecot",
    "suggère des produits",
    "commander une poignet",
    "commander une poignée lecot",
  ];

  lecotPhrases.forEach((text) => {
    it(`demande Lecot : "${text}"`, () => {
      expect(isMaterialAgentLecotCommandText(text)).toBe(true);
      expect(isCompanyStockAgentInScope(text)).toBe(true);
    });
  });

  const productQueries: { text: string; contains: string }[] = [
    { text: "commander une perceuse lecot", contains: "perceuse" },
    { text: "serrure lecot", contains: "serrure" },
    { text: "commander une poignet", contains: "poign" },
  ];

  productQueries.forEach(({ text, contains }) => {
    it(`indice catalogue : "${text}"`, () => {
      const q = resolveLecotCatalogSearchQuery(text, []);
      expect(q).not.toBeNull();
      expect(q!.toLowerCase()).toContain(contains);
    });
  });
});
