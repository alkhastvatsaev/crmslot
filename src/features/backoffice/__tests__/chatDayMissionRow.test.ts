import {
  missionsToChatDayRows,
  buildChatDayRows,
  interventionsToChatDayRows,
} from "@/features/backoffice/chatDayMissionRow";
import type { Intervention } from "@/features/interventions/types";
import type { Mission } from "@/features/map/missionTypes";
import { makeIntervention } from "@/test-utils/factories";

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

describe("buildChatDayRows", () => {
  const today = new Date("2026-06-17T12:00:00.000Z");

  it("prefers Firestore interventions when day missions are empty", () => {
    const iv = makeIntervention({
      id: "iv-chat-1",
      clientFirstName: "Alice",
      clientLastName: "Martin",
      requestedDate: "2026-06-17",
      requestedTime: "10:00",
      status: "pending",
    });
    const rows = buildChatDayRows({
      interventions: [iv],
      dayMissions: [],
      selectedDate: today,
      workspace: { isTenantUser: true, activeRole: "admin" },
    });
    expect(rows).toHaveLength(1);
    expect(rows[0]?.threadId).toBe("iv-chat-1");
    expect(rows[0]?.clientName).toMatch(/Alice/i);
  });

  it("includes pending intake in chat list (not only released-to-field)", () => {
    const pending = makeIntervention({
      id: "iv-pending",
      status: "pending",
      requestedDate: "2026-06-17",
    });
    const rows = buildChatDayRows({
      interventions: [pending],
      selectedDate: today,
      workspace: { isTenantUser: true, activeRole: "admin" },
    });
    expect(rows.map((r) => r.threadId)).toContain("iv-pending");
  });

  it("includes off-day dossier when includeInterventionIds is set", () => {
    const offDay = makeIntervention({
      id: "iv-off-day",
      clientFirstName: "Paul",
      clientLastName: "Durand",
      requestedDate: "2026-06-10",
      requestedTime: "09:00",
      status: "assigned",
    });
    const rows = buildChatDayRows({
      interventions: [offDay],
      selectedDate: today,
      workspace: { isTenantUser: true, activeRole: "admin" },
      includeInterventionIds: ["iv-off-day"],
    });
    expect(rows.map((r) => r.threadId)).toContain("iv-off-day");
  });

  it("merges extra local map missions without duplicating intervention ids", () => {
    const iv = makeIntervention({
      id: "iv-firestore-1",
      requestedDate: "2026-06-17",
      clientFirstName: "Jean",
      clientLastName: "Dupont",
    });
    const rows = buildChatDayRows({
      interventions: [iv],
      dayMissions: [
        {
          id: 1,
          key: "iv-firestore-1",
          clientName: "Jean",
          coordinates: [4.35, 50.84],
          time: "14:00",
          status: "assigned",
          statusCode: "assigned",
        } as import("@/features/map/missionTypes").Mission,
        {
          id: 202605180,
          clientName: "M. Dubois",
          coordinates: [4.35, 50.84],
          time: "10:00",
          status: "À venir",
        } as import("@/features/map/missionTypes").Mission,
      ],
      selectedDate: today,
      workspace: { isTenantUser: true, activeRole: "admin" },
    });
    expect(rows).toHaveLength(2);
    expect(rows.map((r) => r.threadId).sort()).toEqual(["202605180", "iv-firestore-1"]);
  });
});
