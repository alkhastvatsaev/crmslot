import type { Intervention } from "@/features/interventions/types";
import { filterInterventionsForMapTechnicianMissions } from "@/features/interventions/mapTechnicianMissions";

function iv(
  partial: Partial<Intervention> & Pick<Intervention, "status">,
): Intervention {
  return {
    id: partial.id ?? "x",
    title: "Test",
    address: "Rue test",
    time: "10:00",
    location: { lat: 50.84, lng: 4.35 },
    ...partial,
  };
}

describe("filterInterventionsForMapTechnicianMissions", () => {
  const anchor = new Date("2026-05-16T12:00:00");

  it("excludes pending intake and missions without coordinates", () => {
    const rows = [
      iv({ id: "pending", status: "pending" }),
      iv({
        id: "no-gps",
        status: "en_route",
        scheduledDate: "2026-05-16",
        scheduledTime: "10:00",
        location: undefined,
      }),
      iv({
        id: "map-ok",
        status: "en_route",
        scheduledDate: "2026-05-16",
        scheduledTime: "11:00",
      }),
    ];
    expect(filterInterventionsForMapTechnicianMissions(rows, "today", anchor).map((r) => r.id)).toEqual(
      ["map-ok"],
    );
  });

  it("excludes missions scheduled outside today tab", () => {
    const rows = [
      iv({
        id: "future",
        status: "en_route",
        scheduledDate: "2030-01-01",
        scheduledTime: "09:00",
      }),
    ];
    expect(filterInterventionsForMapTechnicianMissions(rows, "today", anchor)).toEqual([]);
  });
});
