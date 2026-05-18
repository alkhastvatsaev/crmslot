import {
  missionsToChatDayRows,
} from "@/features/backoffice/chatDayMissionRow";
import type { Mission } from "@/utils/mockMissions";

describe("missionsToChatDayRows", () => {
  it("maps demo missions with stable thread id", () => {
    const rows = missionsToChatDayRows([
      {
        id: 202605180,
        clientName: "M. Dubois",
        coordinates: [4.35, 50.84],
        time: "10:00",
        status: "À venir",
      } as Mission,
    ]);
    expect(rows).toHaveLength(1);
    expect(rows[0]?.threadId).toBe("202605180");
    expect(rows[0]?.clientName).toBe("M. Dubois");
    expect(rows[0]?.statusLabel).toBe("À venir");
  });

  it("uses firestore key when present", () => {
    const rows = missionsToChatDayRows([
      {
        id: 1,
        key: "iv-firestore-1",
        clientName: "Jean",
        coordinates: [4.35, 50.84],
        time: "14:00",
        status: "assigned",
        statusCode: "assigned",
      } as Mission,
    ]);
    expect(rows[0]?.threadId).toBe("iv-firestore-1");
  });
});
