import { sendNativePushToUser } from "@/features/notifications/sendNativePushAdmin";

jest.mock("@/core/config/firebase-admin", () => ({
  isFirebaseAdminReady: jest.fn(),
  getAdminDb: jest.fn(),
}));

const sendMock = jest.fn();
jest.mock("firebase-admin", () => ({
  __esModule: true,
  default: {
    messaging: () => ({ send: (...args: unknown[]) => sendMock(...args) }),
  },
  messaging: () => ({ send: (...args: unknown[]) => sendMock(...args) }),
  apps: [],
}));

import { isFirebaseAdminReady, getAdminDb } from "@/core/config/firebase-admin";

describe("sendNativePushToUser", () => {
  beforeEach(() => {
    sendMock.mockReset();
    (isFirebaseAdminReady as jest.Mock).mockReset();
    (getAdminDb as jest.Mock).mockReset();
  });

  it("retourne report vide si admin non prêt", async () => {
    (isFirebaseAdminReady as jest.Mock).mockReturnValue(false);
    const result = await sendNativePushToUser({ uid: "u1", title: "t", body: "b" });
    expect(result).toEqual({ sent: 0, failed: 0, removedStale: 0 });
  });

  it("envoie à chaque token et incrémente sent", async () => {
    (isFirebaseAdminReady as jest.Mock).mockReturnValue(true);
    const ref = { delete: jest.fn().mockResolvedValue(undefined) };
    const docs = [
      { data: () => ({ token: "tok1" }), ref },
      { data: () => ({ token: "tok2" }), ref },
    ];
    (getAdminDb as jest.Mock).mockReturnValue({
      collection: () => ({
        doc: () => ({
          collection: () => ({ get: async () => ({ empty: false, docs }) }),
        }),
      }),
    });
    sendMock.mockResolvedValue("msg-id");

    const result = await sendNativePushToUser({
      uid: "u1",
      title: "Titre",
      body: "Corps",
      data: { bmTechCase: "case-42" },
    });

    expect(result.sent).toBe(2);
    expect(result.failed).toBe(0);
    expect(sendMock).toHaveBeenCalledTimes(2);
  });

  it("supprime tokens invalides (registration-token-not-registered)", async () => {
    (isFirebaseAdminReady as jest.Mock).mockReturnValue(true);
    const deleteFn = jest.fn().mockResolvedValue(undefined);
    const ref = { delete: deleteFn };
    const docs = [{ data: () => ({ token: "stale" }), ref }];
    (getAdminDb as jest.Mock).mockReturnValue({
      collection: () => ({
        doc: () => ({
          collection: () => ({ get: async () => ({ empty: false, docs }) }),
        }),
      }),
    });
    const err = Object.assign(new Error("stale"), {
      code: "messaging/registration-token-not-registered",
    });
    sendMock.mockRejectedValue(err);

    const result = await sendNativePushToUser({ uid: "u1", title: "t", body: "b" });
    expect(result.removedStale).toBe(1);
    expect(result.sent).toBe(0);
    expect(deleteFn).toHaveBeenCalled();
  });
});
