import { buildChatDayRows } from "@/features/backoffice/chatDayMissionRow";
import type { Intervention } from "@/features/interventions/types";

const anchor = new Date("2026-06-19T12:00:00");

function iv(id: string, overrides: Partial<Intervention> = {}): Intervention {
  return {
    id,
    title: id,
    address: "Rue 1",
    status: "assigned",
    time: "10:00",
    location: { lat: 0, lng: 0 },
    ...overrides,
  };
}

describe("buildChatDayRows", () => {
  it("includes all non-cancelled interventions with today first", () => {
    const rows = buildChatDayRows({
      interventions: [
        iv("old-1", {
          scheduledDate: "2026-06-10",
          scheduledTime: "14:00",
          clientFirstName: "Paul",
          clientLastName: "Ancien",
        }),
        iv("today-1", {
          scheduledDate: "2026-06-19",
          scheduledTime: "09:00",
          clientFirstName: "Marie",
          clientLastName: "Du jour",
        }),
        iv("today-2", {
          scheduledDate: "2026-06-19",
          scheduledTime: "11:00",
          clientFirstName: "Jean",
          clientLastName: "Midi",
        }),
        iv("cancelled", { status: "cancelled", scheduledDate: "2026-06-19" }),
      ],
      selectedDate: anchor,
    });

    expect(rows.map((r) => r.threadId)).toEqual(["today-1", "today-2", "old-1"]);
    expect(rows[0]?.isToday).toBe(true);
    expect(rows[2]?.isToday).toBe(false);
  });
});
