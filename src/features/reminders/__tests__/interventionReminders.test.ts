import { buildInterventionReminders } from "@/features/reminders/interventionReminders";
import type { Intervention } from "@/features/interventions";

const base: Omit<Intervention, "id" | "status"> = {
  title: "T",
  address: "A",
  time: "10:00",
  location: { lat: 0, lng: 0 },
};

describe("buildInterventionReminders", () => {
  it("flags done without invoice after 3 days", () => {
    const now = new Date("2026-05-10T12:00:00Z").getTime();
    const rows = buildInterventionReminders(
      [
        {
          ...base,
          id: "iv-1",
          status: "done",
          createdAt: "2026-05-01T10:00:00Z",
        } as Intervention,
      ],
      now
    );
    expect(rows.some((r) => r.kind === "done_not_invoiced")).toBe(true);
  });
});
