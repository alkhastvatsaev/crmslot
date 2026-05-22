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
