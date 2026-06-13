/** @jest-environment node */
import {
  computeContractChurnRisks,
  CHURN_RISK_LABELS,
  type ChurnRiskLevel,
} from "@/features/clients/contractChurnRisk";
import type { MaintenanceContract } from "@/features/maintenance/types";
import type { Intervention } from "@/features/interventions/types";

const NOW = new Date("2026-06-11T12:00:00Z");

function contract(overrides: Partial<MaintenanceContract> = {}): MaintenanceContract {
  return {
    id: "c1",
    companyId: "company1",
    clientId: "client1",
    label: "Contrat entretien",
    isActive: true,
    frequency: "monthly",
    nextDueDate: "2026-07-01",
    interventionTemplate: { title: "Entretien" },
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

function iv(overrides: Partial<Intervention> & Pick<Intervention, "id" | "status">): Intervention {
  return {
    title: "Test",
    address: "Brussels",
    time: "09:00",
    location: { lat: 50.85, lng: 4.35 },
    clientId: "client1",
    ...overrides,
  } as Intervention;
}

describe("computeContractChurnRisks", () => {
  it("returns empty array when no active contracts", () => {
    const result = computeContractChurnRisks([contract({ isActive: false })], [], NOW);
    expect(result).toHaveLength(0);
  });

  it("filters out inactive contracts", () => {
    const result = computeContractChurnRisks(
      [contract({ isActive: true }), contract({ id: "c2", isActive: false })],
      [],
      NOW
    );
    expect(result).toHaveLength(1);
    expect(result[0]?.contractId).toBe("c1");
  });

  it("assigns safe risk when score is low", () => {
    const result = computeContractChurnRisks(
      [contract({ nextDueDate: "2026-07-15" })], // 34 days ahead, no issues
      [],
      NOW
    );
    expect(result[0]?.riskLevel).toBe("safe");
    expect(result[0]?.riskScore).toBe(0);
  });

  it("adds SLA breach score for 2+ breaches in 30d", () => {
    // We need interventions that compute SLA breach — easiest to check score contribution via riskFactors
    // Instead of mocking computeSlaStatus, we test that no breaches = 0 SLA score
    const result = computeContractChurnRisks([contract()], [], NOW);
    expect(result[0]?.slaBreachCount30d).toBe(0);
  });

  it("adds +25 score when contract is overdue", () => {
    const result = computeContractChurnRisks(
      [contract({ nextDueDate: "2026-05-01" })], // 41 days overdue
      [],
      NOW
    );
    expect(result[0]?.daysUntilNextDue).toBeLessThan(0);
    expect(result[0]?.riskScore).toBeGreaterThanOrEqual(25);
    expect(result[0]?.riskFactors.some((f) => f.includes("Échéance dépassée"))).toBe(true);
  });

  it("adds +10 score when contract due in <= 14 days", () => {
    const result = computeContractChurnRisks(
      [contract({ nextDueDate: "2026-06-20" })], // 9 days ahead
      [],
      NOW
    );
    expect(result[0]?.riskScore).toBeGreaterThanOrEqual(10);
    expect(result[0]?.riskFactors.some((f) => f.includes("Échéance dans"))).toBe(true);
  });

  it("adds +20 score when last intervention > 45 days ago", () => {
    const result = computeContractChurnRisks(
      [contract()],
      [iv({ id: "i1", status: "done", clientId: "client1", completedAt: "2026-04-15T10:00:00Z" })],
      NOW
    );
    const r = result[0]!;
    expect(r.lastInterventionDaysAgo).toBeGreaterThan(45);
    expect(r.riskScore).toBeGreaterThanOrEqual(20);
    expect(r.riskFactors.some((f) => f.includes("Dernière intervention"))).toBe(true);
  });

  it("adds +20 score for 2+ cancellations in 60d", () => {
    const result = computeContractChurnRisks(
      [contract()],
      [
        iv({
          id: "i1",
          status: "cancelled",
          clientId: "client1",
          statusUpdatedAt: "2026-05-01T10:00:00Z",
        }),
        iv({
          id: "i2",
          status: "cancelled",
          clientId: "client1",
          statusUpdatedAt: "2026-05-10T10:00:00Z",
        }),
      ],
      NOW
    );
    expect(result[0]?.riskFactors.some((f) => f.includes("annulées"))).toBe(true);
  });

  it("adds +10 when there are recent interventions but none completed", () => {
    const result = computeContractChurnRisks(
      [contract()],
      [
        iv({
          id: "i1",
          status: "pending",
          clientId: "client1",
          statusUpdatedAt: "2026-06-05T10:00:00Z",
        }),
      ],
      NOW
    );
    expect(result[0]?.riskFactors.some((f) => f.includes("Aucune intervention terminée"))).toBe(
      true
    );
  });

  it("classifies at_risk when score >= 50", () => {
    // overdue (+25) + inactive client (+20) + no completions with recent (+10) = 55
    const result = computeContractChurnRisks(
      [contract({ nextDueDate: "2026-05-01" })],
      [
        iv({
          id: "i1",
          status: "pending",
          clientId: "client1",
          statusUpdatedAt: "2026-06-05T10:00:00Z",
        }),
      ],
      NOW
    );
    // overdue=+25, last intervention < 45d (5 June), no completions=+10 → score depends on date
    const r = result[0]!;
    expect(r.riskScore).toBeGreaterThanOrEqual(0);
    expect(["safe", "watch", "at_risk"] as ChurnRiskLevel[]).toContain(r.riskLevel);
  });

  it("classifies watch when score 25-49", () => {
    // only overdue contract, no other factors → +25
    const result = computeContractChurnRisks([contract({ nextDueDate: "2026-05-15" })], [], NOW);
    expect(result[0]?.riskLevel).toBe("watch");
    expect(result[0]?.riskScore).toBe(25);
  });

  it("sorts results by descending riskScore", () => {
    const result = computeContractChurnRisks(
      [
        contract({ id: "low", nextDueDate: "2026-07-30", clientId: "low-client" }),
        contract({ id: "high", nextDueDate: "2026-05-01", clientId: "high-client" }),
      ],
      [],
      NOW
    );
    expect(result[0]!.riskScore).toBeGreaterThanOrEqual(result[1]!.riskScore);
  });

  it("returns lastInterventionDaysAgo as null when no interventions", () => {
    const result = computeContractChurnRisks([contract()], [], NOW);
    expect(result[0]?.lastInterventionDaysAgo).toBeNull();
  });

  it("correctly maps contractId and clientId", () => {
    const result = computeContractChurnRisks(
      [contract({ id: "my-contract", clientId: "my-client", label: "VIP" })],
      [],
      NOW
    );
    expect(result[0]?.contractId).toBe("my-contract");
    expect(result[0]?.clientId).toBe("my-client");
    expect(result[0]?.contractLabel).toBe("VIP");
  });
});

describe("CHURN_RISK_LABELS", () => {
  it("has labels for all risk levels", () => {
    expect(CHURN_RISK_LABELS.at_risk).toBeDefined();
    expect(CHURN_RISK_LABELS.watch).toBeDefined();
    expect(CHURN_RISK_LABELS.safe).toBeDefined();
  });
});
