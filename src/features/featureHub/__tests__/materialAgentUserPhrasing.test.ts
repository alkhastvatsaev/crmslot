/**
 * Robustesse « 100 utilisateurs » — formulations différentes, même comportement attendu
 * (périmètre, catalogue Lecot, nom client, reset session).
 * Pas d'appel OpenAI : logique pure côté client + route matériel.
 */

import {
  classifyCompanyStockAgentIntent,
  isCompanyStockAgentInScope,
} from "@/features/featureHub/companyStockAgentScope";
import {
  parseMaterialAgentClientNameFromUserText,
  shouldResetMaterialOrderClientSession,
} from "@/features/featureHub/materialAgentOrderClient";
import {
  MATERIAL_AGENT_USER_PHRASES,
  type MaterialPhraseCase,
} from "@/features/featureHub/__tests__/fixtures/materialAgentUserPhrases";

function byKind<K extends MaterialPhraseCase["kind"]>(
  kind: K,
): Extract<MaterialPhraseCase, { kind: K }>[] {
  return MATERIAL_AGENT_USER_PHRASES.filter(
    (c): c is Extract<MaterialPhraseCase, { kind: K }> => c.kind === kind,
  );
}

describe("agent Matériel — formulations utilisateurs (≈100 cas)", () => {
  const inScope = byKind("in_scope");
  const outOfScope = byKind("out_of_scope");
  const lecot = byKind("lecot_catalog");
  const intents = byKind("intent");
  const clientNames = byKind("client_name");
  const notClient = byKind("not_client_name");
  const resets = byKind("reset_client");

  it("couvre au moins 100 scénarios distincts", () => {
    expect(MATERIAL_AGENT_USER_PHRASES.length).toBeGreaterThanOrEqual(100);
  });

  describe.each(inScope.map((c) => [c.id, c.phrase] as const))(
    "périmètre matériel [%s]",
    (_id, phrase) => {
      it("accepte la demande", () => {
        expect(isCompanyStockAgentInScope(phrase)).toBe(true);
        expect(classifyCompanyStockAgentIntent(phrase, true)).not.toBe("off_topic");
      });
    },
  );

  describe.each(outOfScope.map((c) => [c.id, c.phrase] as const))(
    "hors périmètre [%s]",
    (_id, phrase) => {
      it("refuse la demande", () => {
        expect(isCompanyStockAgentInScope(phrase)).toBe(false);
      });
    },
  );

  describe.each(lecot.map((c) => [c.id, c.phrase] as const))(
    "catalogue Lecot [%s]",
    (_id, phrase) => {
      it("est dans le périmètre matériel (catalogue via OpenAI + search_lecot_products)", () => {
        expect(isCompanyStockAgentInScope(phrase)).toBe(true);
        expect(classifyCompanyStockAgentIntent(phrase, true)).not.toBe("off_topic");
      });
    },
  );

  describe.each(intents.map((c) => [c.id, c.phrase, c.intent] as const))(
    "intent local [%s]",
    (_id, phrase, intent) => {
      it(`classifie comme ${intent}`, () => {
        expect(classifyCompanyStockAgentIntent(phrase, true)).toBe(intent);
      });
    },
  );

  describe.each(clientNames.map((c) => [c.id, c.phrase, c.name, c.messages] as const))(
    "nom client [%s]",
    (_id, phrase, name, messages) => {
      it("enregistre le nom", () => {
        expect(parseMaterialAgentClientNameFromUserText(phrase, messages)).toBe(name);
      });
    },
  );

  describe.each(notClient.map((c) => [c.id, c.phrase, c.messages] as const))(
    "pas un nom client [%s]",
    (_id, phrase, messages) => {
      it("ne traite pas comme nom", () => {
        expect(parseMaterialAgentClientNameFromUserText(phrase, messages)).toBeNull();
      });
    },
  );

  describe.each(resets.map((c) => [c.id, c.phrase] as const))(
    "reset client [%s]",
    (_id, phrase) => {
      it("réinitialise la session client", () => {
        expect(shouldResetMaterialOrderClientSession(phrase)).toBe(true);
      });
    },
  );
});
