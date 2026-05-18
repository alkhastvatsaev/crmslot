import {
  findDueContracts,
  buildInterventionDraft,
  computeNextDueDate,
} from "../generateDueInterventions";
import type { MaintenanceContract } from "../types";

const base: Omit<MaintenanceContract, "id" | "nextDueDate"> = {
  companyId: "co-1",
  clientId: "cl-1",
  label: "Test",
  frequency: "monthly",
  interventionTemplate: { title: "Vérification annuelle" },
  isActive: true,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

describe("findDueContracts", () => {
  it("returns contracts whose nextDueDate <= today", () => {
    const today = new Date("2026-05-18");
    const contracts: MaintenanceContract[] = [
      { ...base, id: "due", nextDueDate: "2026-05-18" },
      { ...base, id: "past", nextDueDate: "2026-04-01" },
      { ...base, id: "future", nextDueDate: "2026-06-01" },
    ];
    const due = findDueContracts(contracts, today);
    expect(due.map((c) => c.id)).toEqual(expect.arrayContaining(["due", "past"]));
    expect(due.find((c) => c.id === "future")).toBeUndefined();
  });

  it("ignores inactive contracts", () => {
    const today = new Date("2026-05-18");
    const inactive = { ...base, id: "inactive", nextDueDate: "2026-01-01", isActive: false };
    expect(findDueContracts([inactive], today)).toHaveLength(0);
  });
});

describe("buildInterventionDraft", () => {
  it("maps contract to intervention draft", () => {
    const contract: MaintenanceContract = {
      ...base,
      id: "c-1",
      nextDueDate: "2026-05-18",
      interventionTemplate: {
        title: "Vérif serrures",
        category: "serrurerie",
        estimatedDurationMinutes: 60,
      },
    };
    const draft = buildInterventionDraft(contract);
    expect(draft.status).toBe("pending");
    expect(draft.sourceContractId).toBe("c-1");
    expect(draft.scheduledDate).toBe("2026-05-18");
    expect(draft.category).toBe("serrurerie");
    expect(draft.estimatedDurationMinutes).toBe(60);
  });
});

describe("computeNextDueDate", () => {
  it("advances nextDueDate by the correct number of days", () => {
    const contract: MaintenanceContract = { ...base, id: "c-1", nextDueDate: "2026-05-18", frequency: "monthly" };
    expect(computeNextDueDate(contract)).toBe("2026-06-17");
  });

  it("advances yearly by 365 days", () => {
    const contract: MaintenanceContract = { ...base, id: "c-2", nextDueDate: "2026-01-01", frequency: "yearly" };
    expect(computeNextDueDate(contract)).toBe("2027-01-01");
  });
});
