import { ensurePortalChatProfile } from "@/features/backoffice/ensurePortalChatProfile";

jest.mock("firebase/firestore", () => ({
  doc: jest.fn((_db: unknown, collection: string, uid: string) => ({
    path: `${collection}/${uid}`,
  })),
  setDoc: jest.fn(async () => undefined),
  serverTimestamp: jest.fn(() => ({ __ts: true })),
}));

jest.mock("@/features/auth/clientPortalConstants", () => ({
  CLIENT_PORTAL_PROFILE_COLLECTION: "client_portal_profiles",
}));

const { doc, setDoc } = jest.requireMock("firebase/firestore") as {
  doc: jest.Mock;
  setDoc: jest.Mock;
};

describe("ensurePortalChatProfile", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("écrit companyId sur le profil portail", async () => {
    const db = {} as import("firebase/firestore").Firestore;
    const user = { uid: "u1", email: "a@b.c", displayName: "A B" } as import("firebase/auth").User;

    await ensurePortalChatProfile(db, user, "co-abc");

    expect(doc).toHaveBeenCalledWith(db, "client_portal_profiles", "u1");
    expect(setDoc).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ uid: "u1", companyId: "co-abc", role: "client" }),
      { merge: true }
    );
  });

  it("ignore companyId vide", async () => {
    const db = {} as import("firebase/firestore").Firestore;
    const user = { uid: "u1" } as import("firebase/auth").User;
    await ensurePortalChatProfile(db, user, "  ");
    expect(setDoc).not.toHaveBeenCalled();
  });
});
