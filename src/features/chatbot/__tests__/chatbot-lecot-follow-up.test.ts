import {
  extractLecotProductKeyword,
  normalizeLecotProductSearchQuery,
  resolveLecotCatalogSearchQuery,
} from "@/features/chatbot/chatbot-lecot-follow-up";

describe("chatbot-lecot-follow-up", () => {
  it("extractLecotProductKeyword detects serrure and cylindre", () => {
    expect(extractLecotProductKeyword("propose 5 serrures")).toBe("serrure");
    expect(extractLecotProductKeyword("je veux un cylindre Yale")).toBe("cylindre");
  });

  it("extractLecotProductKeyword maps poignet typo to poignée", () => {
    expect(extractLecotProductKeyword("commander une poignet")).toBe("poignée");
    expect(normalizeLecotProductSearchQuery("poignet")).toBe("poignée");
  });

  it("resolveLecotCatalogSearchQuery from order phrase with client name", () => {
    const q = resolveLecotCatalogSearchQuery(
      "tu peux commander pour le client vatsaev une serrure sur lecot",
      [],
    );
    expect(q).toBe("serrure");
  });

  it("resolveLecotCatalogSearchQuery ignores email phrasing", () => {
    expect(resolveLecotCatalogSearchQuery("envoie un mail a monsieur dupont", [])).toBeNull();
  });

  it("resolveLecotCatalogSearchQuery uses prior user message after oui", () => {
    const q = resolveLecotCatalogSearchQuery("oui", [
      { role: "user", content: "commander une serrure lecot pour Dupont" },
      { role: "assistant", content: "Donnez des détails sur la serrure" },
      { role: "user", content: "oui" },
    ]);
    expect(q).toBe("serrure");
  });
});
