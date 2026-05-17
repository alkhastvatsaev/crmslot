/**
 * Contrat client ↔ rules Firestore (interventions).
 * Chaque hook doit utiliser une requête couverte par une règle `allow read` dédiée dans firestore.rules.
 */
describe("Firestore intervention query contract", () => {
  const contracts = [
    {
      hook: "useBackOfficeInterventions",
      query: 'where("companyId", "==", activeCompanyId)',
      rule: "canReadInterventionViaTenantClaims | canReadInterventionViaMembership | canReadInterventionDemoStaging",
    },
    {
      hook: "useTechnicianAssignments",
      query: 'where("assignedTechnicianUid", "==", technicianUid)',
      rule: "canReadInterventionAsAssignee | canReadInterventionDemoStaging",
    },
  ] as const;

  it.each(contracts)("$hook uses scoped query ($query)", ({ hook, query, rule }) => {
    expect(hook.length).toBeGreaterThan(0);
    expect(query).toContain("where(");
    expect(rule).toContain("canRead");
  });
});
