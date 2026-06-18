import { buildTechnicianMissionPresentation } from "@/features/interventions/technicianMissionPresentation";
import type { Intervention } from "@/features/interventions/types";

const t = (key: string) => key;

describe("buildTechnicianMissionPresentation", () => {
  it("builds client name and short label from first name", () => {
    const iv: Intervention = {
      id: "iv-1",
      title: "Test",
      address: "Rue Example 1",
      time: "10:00",
      status: "en_route",
      scheduledDate: "2026-05-16",
      scheduledTime: "10:00",
      clientFirstName: "jean",
      clientLastName: "martin",
      location: { lat: 50.8, lng: 4.35 },
    };

    const p = buildTechnicianMissionPresentation(iv, t);
    expect(p.clientDisplayName).toBe("Jean Martin");
    expect(p.shortClientLabel).toBe("Jean");
    expect(p.timeLabel).toBe("10:00");
    expect(p.address).toContain("Rue Example");
    expect(p.addressMapsHref).toContain("google.com/maps");
  });
});
