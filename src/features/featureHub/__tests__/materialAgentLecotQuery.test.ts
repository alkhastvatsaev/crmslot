import {
  MATERIAL_AGENT_LECOT_DEFAULT_QUERY,
  resolveMaterialAgentLecotSearchQuery,
} from "@/features/featureHub/materialAgentLecotQuery";

describe("resolveMaterialAgentLecotSearchQuery", () => {
  it("maps bare commande lecot to default locksmith catalog query", () => {
    expect(resolveMaterialAgentLecotSearchQuery("commande lecot", [])).toBe(
      MATERIAL_AGENT_LECOT_DEFAULT_QUERY,
    );
  });

  it("maps suggest products to default catalog when no product keyword", () => {
    expect(resolveMaterialAgentLecotSearchQuery("suggere des produits", [])).toBe(
      MATERIAL_AGENT_LECOT_DEFAULT_QUERY,
    );
  });

  it("keeps specific product keyword from parent resolver", () => {
    expect(resolveMaterialAgentLecotSearchQuery("commander une perceuse lecot", [])).toBe(
      "perceuse",
    );
  });

  it("maps browse-catalog phrases without product to default query", () => {
    expect(resolveMaterialAgentLecotSearchQuery("montre le catalogue", [])).toBe(
      MATERIAL_AGENT_LECOT_DEFAULT_QUERY,
    );
    expect(resolveMaterialAgentLecotSearchQuery("propose des articles", [])).toBe(
      MATERIAL_AGENT_LECOT_DEFAULT_QUERY,
    );
  });
});

describe("anti-hallucination: noms propres dans contexte Lecot → null", () => {
  const lecotMessages = [
    { role: "user", content: "commande lecot" },
    { role: "assistant", content: "Voici le catalogue Lecot..." },
  ];

  it("Bach en contexte Lecot → null (va à OpenAI)", () => {
    expect(resolveMaterialAgentLecotSearchQuery("Bach", lecotMessages)).toBeNull();
  });

  it("Dupont en contexte Lecot → null", () => {
    expect(resolveMaterialAgentLecotSearchQuery("Dupont", lecotMessages)).toBeNull();
  });

  it("Martin SPRL en contexte Lecot → null", () => {
    expect(resolveMaterialAgentLecotSearchQuery("Martin SPRL", lecotMessages)).toBeNull();
  });

  it("serrure en contexte Lecot → serrure", () => {
    expect(resolveMaterialAgentLecotSearchQuery("serrure", lecotMessages)).toBe("serrure");
  });
});
