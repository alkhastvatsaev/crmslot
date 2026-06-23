import { buildCaseHubKpis, filterCaseInterventions } from "@/features/caseHub/caseHubPatronMetrics";
import type { Intervention } from "@/features/interventions";

const NOW = new Date("2026-06-18T12:00:00.000Z");

const iv = (status: Intervention["status"], id: string): Intervention => ({
  id,
  title: id,
  address: "a",
  time: "10:00",
  status,
  location: { lat: 0, lng: 0 },
  createdAt: "2026-06-17T10:00:00.000Z",
});

describe("caseHubPatronMetrics", () => {
  it("counts open and active cases", () => {
    const interventions = [iv("pending", "1"), iv("in_progress", "2"), iv("done", "3")];
    const kpis = buildCaseHubKpis({ interventions, now: NOW });
    expect(kpis.openCount).toBe(2);
    expect(kpis.activeCount).toBe(1);
  });

  it("filters done cases", () => {
    const interventions = [iv("done", "1"), iv("pending", "2")];
    expect(filterCaseInterventions(interventions, "done")).toHaveLength(1);
  });
});
