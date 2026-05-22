import { buildMaterialAgentSystemPrompt } from "@/features/featureHub/materialAgentSystemPrompt";

describe("buildMaterialAgentSystemPrompt", () => {
  it("states material-only scope and embeds stock snapshot when provided", () => {
    const prompt = buildMaterialAgentSystemPrompt({
      companyName: "Demo SA",
      companyId: "co-demo",
      today: "2026-05-22",
      stockSnapshot: '{"outCount":2}',
    });

    expect(prompt).toMatch(/Agent Matériel/i);
    expect(prompt).toMatch(/stock et les commandes matériel/i);
    expect(prompt).toMatch(/Demo SA \(co-demo\)/);
    expect(prompt).toMatch(/2026-05-22/);
    expect(prompt).toMatch(/"outCount":2/);
    expect(prompt).toMatch(/search_lecot_products/);
    expect(prompt).toMatch(/order_lecot_parts/);
  });

  it("omits snapshot block when stockSnapshot is null", () => {
    const prompt = buildMaterialAgentSystemPrompt({
      companyName: "X",
      companyId: "y",
      today: "2026-01-01",
      stockSnapshot: null,
    });
    expect(prompt).not.toMatch(/Snapshot stock actuel/);
  });
});
