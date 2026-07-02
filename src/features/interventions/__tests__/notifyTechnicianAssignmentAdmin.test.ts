/**
 * @jest-environment node
 */
import { notifyTechnicianAssignmentAdmin } from "@/features/interventions/server/notifyTechnicianAssignmentAdmin";
import { sendNativePushToUser } from "@/features/notifications/sendNativePushAdmin";
import { makeIntervention } from "@/test-utils/factories";

jest.mock("@/features/notifications/sendNativePushAdmin", () => ({
  sendNativePushToUser: jest.fn(),
}));

const sendPushMock = sendNativePushToUser as jest.MockedFunction<typeof sendNativePushToUser>;

describe("notifyTechnicianAssignmentAdmin", () => {
  beforeEach(() => {
    sendPushMock.mockReset();
  });

  it("sends assignment push when prefs allow", async () => {
    const userGet = jest.fn().mockResolvedValue({
      data: () => ({ notificationPreferences: { push: true } }),
    });
    const db = {
      collection: jest.fn(() => ({ doc: () => ({ get: userGet }) })),
    } as unknown as FirebaseFirestore.Firestore;

    sendPushMock.mockResolvedValue({ sent: 1, failed: 0, removedStale: 0 });

    const iv = makeIntervention({ id: "iv-1", title: "Chaudière" });
    const result = await notifyTechnicianAssignmentAdmin({
      db,
      technicianUid: "tech-1",
      interventionId: "iv-1",
      iv,
    });

    expect(result.sent).toBe(1);
    expect(sendPushMock).toHaveBeenCalledWith(
      expect.objectContaining({
        uid: "tech-1",
        title: "Nouvelle intervention",
        audiences: ["backoffice", "technician"],
        data: expect.objectContaining({
          type: "assignment",
          audience: "technician",
          interventionId: "iv-1",
          bmTechCase: "iv-1",
        }),
      })
    );
  });
});
