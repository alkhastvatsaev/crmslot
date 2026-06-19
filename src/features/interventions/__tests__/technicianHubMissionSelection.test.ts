import { resolveTechnicianHubMissionSelection } from "@/features/interventions/technicianHubMissionSelection";
import type { Intervention } from "@/features/interventions/types";

function iv(partial: Partial<Intervention> = {}): Intervention {
  return {
    id: "iv-1",
    title: "Test",
    address: "Rue 1",
    time: "10:00",
    location: { lat: 0, lng: 0 },
    status: "en_route",
    assignedTechnicianUid: "tech-1",
    scheduledDate: "2026-06-20",
    scheduledTime: "09:00",
    ...partial,
  };
}

describe("resolveTechnicianHubMissionSelection", () => {
  it("keeps current selection when still in day list", () => {
    const list = [iv({ id: "a" }), iv({ id: "b" })];
    expect(resolveTechnicianHubMissionSelection("b", list)).toBe("b");
  });

  it("falls back to first mission of the day", () => {
    const list = [iv({ id: "a" }), iv({ id: "b" })];
    expect(resolveTechnicianHubMissionSelection(null, list)).toBe("a");
    expect(resolveTechnicianHubMissionSelection("gone", list)).toBe("a");
  });

  it("returns null when day has no missions", () => {
    expect(resolveTechnicianHubMissionSelection("a", [])).toBeNull();
  });
});
