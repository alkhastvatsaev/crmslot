import {
  classifyCompanyStockAgentIntent,
  isCompanyStockAgentInScope,
} from "@/features/featureHub/companyStockAgentScope";

describe("companyStockAgentScope", () => {
  it("accepts material-related questions", () => {
    expect(isCompanyStockAgentInScope("quelles ruptures de stock ?")).toBe(true);
    expect(isCompanyStockAgentInScope("cherche gâche électrique")).toBe(true);
    expect(classifyCompanyStockAgentIntent("ruptures", true)).toBe("list_out");
  });

  it("rejects clearly off-topic questions", () => {
    expect(isCompanyStockAgentInScope("envoie la facture par email au client")).toBe(false);
    expect(isCompanyStockAgentInScope("assigne un technicien demain")).toBe(false);
    expect(classifyCompanyStockAgentIntent("planning technicien", false)).toBe("off_topic");
  });

  it("does not treat bare question-mark as help (HELP_RE regression)", () => {
    // A billing question with ? must NOT pass scope just because of the ?
    expect(isCompanyStockAgentInScope("quelle est la facture du client ?")).toBe(false);
  });

  it("classifies summary and search", () => {
    expect(classifyCompanyStockAgentIntent("état du stock", true)).toBe("summary");
    expect(classifyCompanyStockAgentIntent("cherche cylindre euro", true)).toBe("search");
  });
});
