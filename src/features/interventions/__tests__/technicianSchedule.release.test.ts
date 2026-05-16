import type { Intervention } from "@/features/interventions/types";
import { scheduledFieldsWhenReleasingToTechnician } from "@/features/interventions/technicianSchedule";

function scheduleRow(
  partial: Pick<
    Intervention,
    "requestedDate" | "requestedTime" | "scheduledDate" | "scheduledTime"
  >,
): Pick<
  Intervention,
  "requestedDate" | "requestedTime" | "scheduledDate" | "scheduledTime"
> {
  return partial;
}

describe("scheduledFieldsWhenReleasingToTechnician", () => {
  const now = new Date("2026-05-16T14:30:00");

  it("prefers existing scheduled fields", () => {
    expect(
      scheduledFieldsWhenReleasingToTechnician(
        scheduleRow({
          scheduledDate: "2026-07-01",
          scheduledTime: "08:15",
        }),
        now,
      ),
    ).toEqual({ scheduledDate: "2026-07-01", scheduledTime: "08:15" });
  });

  it("falls back to client requested slot", () => {
    expect(
      scheduledFieldsWhenReleasingToTechnician(
        scheduleRow({
          requestedDate: "2026-06-10",
          requestedTime: "9:30",
        }),
        now,
      ),
    ).toEqual({ scheduledDate: "2026-06-10", scheduledTime: "09:30" });
  });

  it("uses now when dossier has no dates", () => {
    const out = scheduledFieldsWhenReleasingToTechnician(scheduleRow({}), now);
    expect(out.scheduledDate).toBe("2026-05-16");
    expect(out.scheduledTime).toMatch(/^\d{2}:\d{2}$/);
  });
});
