import { filterTodayChatClients } from "@/features/backoffice/todayChatClients";
import type { Intervention } from "@/features/interventions/types";

const today = new Date("2026-05-18T12:00:00");

function iv(partial: Partial<Intervention> & Pick<Intervention, "id">): Intervention {
  return {
    title: "",
    address: "",
    status: "assigned",
    location: { lat: 50.8, lng: 4.3 },
    scheduledDate: "2026-05-18",
    scheduledTime: "10:00",
    ...partial,
  } as Intervention;
}

describe("filterTodayChatClients", () => {
  it("returns today rows sorted by schedule", () => {
    const rows = filterTodayChatClients(
      [
        iv({ id: "b", scheduledTime: "14:00" }),
        iv({ id: "a", scheduledTime: "09:00" }),
        iv({ id: "other", scheduledDate: "2026-05-19" }),
      ],
      today,
    );
    expect(rows.map((r) => r.id)).toEqual(["a", "b"]);
  });

  it("excludes pending intake on dispatch map", () => {
    const rows = filterTodayChatClients(
      [iv({ id: "pending", status: "pending" }), iv({ id: "ok", status: "assigned" })],
      today,
      { dispatchMap: true },
    );
    expect(rows.map((r) => r.id)).toEqual(["ok"]);
  });
});
