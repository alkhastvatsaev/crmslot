import { isCrmHistoryAgentInScope } from "@/features/crmHistory/crmHistoryAgentScope";

describe("isCrmHistoryAgentInScope", () => {
  it("accepts CRM activity questions", () => {
    expect(isCrmHistoryAgentInScope("Résume l'activité de cette semaine")).toBe(true);
  });

  it("rejects pure billing questions", () => {
    expect(isCrmHistoryAgentInScope("Modifier les lignes de facturation HT/TTC")).toBe(false);
  });
});
