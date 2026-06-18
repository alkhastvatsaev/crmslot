/**
 * @jest-environment node
 */
import { notifyStaffPortalChatAdmin } from "@/features/backoffice/server/notifyStaffPortalChatAdmin";
import { sendNativePushToUser } from "@/features/notifications/sendNativePushAdmin";
import { listCompanyStaff } from "@/features/company/server/listCompanyStaff";

jest.mock("@/features/notifications/sendNativePushAdmin", () => ({
  sendNativePushToUser: jest.fn(),
}));

jest.mock("@/features/company/server/listCompanyStaff", () => ({
  listCompanyStaff: jest.fn(),
}));

const sendPushMock = sendNativePushToUser as jest.MockedFunction<typeof sendNativePushToUser>;
const listStaffMock = listCompanyStaff as jest.MockedFunction<typeof listCompanyStaff>;

describe("notifyStaffPortalChatAdmin", () => {
  beforeEach(() => {
    sendPushMock.mockReset();
    listStaffMock.mockReset();
  });

  it("notifies active staff except sender when push enabled", async () => {
    listStaffMock.mockResolvedValue([
      { uid: "staff-1", active: true } as Awaited<ReturnType<typeof listCompanyStaff>>[number],
      { uid: "client-1", active: true } as Awaited<ReturnType<typeof listCompanyStaff>>[number],
    ]);

    const userGet = jest
      .fn()
      .mockResolvedValueOnce({ data: () => ({ notificationPreferences: { push: true } }) })
      .mockResolvedValueOnce({ data: () => ({ notificationPreferences: { push: true } }) });

    const db = {
      collection: jest.fn(() => ({ doc: () => ({ get: userGet }) })),
    } as unknown as FirebaseFirestore.Firestore;

    sendPushMock.mockResolvedValue({ sent: 1, failed: 0, removedStale: 0 });

    const result = await notifyStaffPortalChatAdmin({
      db,
      auth: {} as never,
      companyId: "co-1",
      senderUid: "client-1",
      preview: "Besoin d'aide",
      interventionId: "iv-1",
      clientLabel: "Alice",
    });

    expect(result.notified).toBe(1);
    expect(sendPushMock).toHaveBeenCalledTimes(1);
    expect(sendPushMock).toHaveBeenCalledWith(
      expect.objectContaining({
        uid: "staff-1",
        data: expect.objectContaining({
          type: "portal_chat",
          companyId: "co-1",
          interventionId: "iv-1",
        }),
      })
    );
  });
});
