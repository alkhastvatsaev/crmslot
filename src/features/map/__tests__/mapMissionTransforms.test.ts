import {
  buildMapHubMissions,
  interventionHasMapCoordinates,
  interventionNumericId,
  isValidMissionCoordinates,
  missionTimeSortScore,
} from "@/features/map/mapMissionTransforms";
import type { Intervention } from "@/features/interventions";
import type { Mission } from "@/features/map/missionTypes";

function baseIntervention(overrides: Partial<Intervention> = {}): Intervention {
  return {
    id: "iv-1",
    title: "Test",
    address: "Rue Test 1",
    time: "10:00",
    status: "assigned",
    location: { lat: 50.85, lng: 4.35 },
    assignedTechnicianUid: "tech-1",
    scheduledDate: "2026-06-23",
    scheduledTime: "10:00",
    createdAt: "2026-06-23T08:00:00Z",
    ...overrides,
  };
}

describe("mapMissionTransforms", () => {
  it("interventionHasMapCoordinates rejects invalid coords", () => {
    expect(interventionHasMapCoordinates(baseIntervention())).toBe(true);
    expect(
      interventionHasMapCoordinates(
        baseIntervention({ location: { lat: Number.NaN, lng: 4 } as Intervention["location"] })
      )
    ).toBe(false);
  });

  it("isValidMissionCoordinates rejects origin", () => {
    expect(isValidMissionCoordinates([4.35, 50.85])).toBe(true);
    expect(isValidMissionCoordinates([0, 0])).toBe(false);
  });

  it("missionTimeSortScore orders Maintenant first", () => {
    expect(missionTimeSortScore("Maintenant")).toBeLessThan(missionTimeSortScore("14:30"));
    expect(missionTimeSortScore("14:30")).toBe(14 * 60 + 30);
  });

  it("interventionNumericId is stable for same id", () => {
    expect(interventionNumericId("abc")).toBe(interventionNumericId("abc"));
    expect(interventionNumericId("abc")).not.toBe(interventionNumericId("abd"));
  });

  it("buildMapHubMissions merges live missions", () => {
    const iv = baseIntervention();
    const live: Mission[] = [
      {
        id: 99,
        key: "live-1",
        clientName: "Live",
        coordinates: [4.4, 50.9],
        time: "09:00",
        date: "2026-06-23",
      },
    ];
    const missions = buildMapHubMissions({
      firestoreInterventions: [iv],
      liveMissions: live,
      selectedDateStr: "2026-06-23",
      selectedDate: new Date("2026-06-23T12:00:00Z"),
      isDispatchMap: true,
      technicianUid: "tech-1",
      clientLabel: (k) => k,
    });
    expect(missions.some((m) => m.key === iv.id)).toBe(true);
    expect(missions.some((m) => m.key === "live-1")).toBe(true);
  });
});
