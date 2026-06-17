import { ensureIvanaChatPortalProfile } from "@/features/backoffice/ensureIvanaChatPortalProfile";

const setDoc = jest.fn(async () => undefined);
const doc = jest.fn((...args: unknown[]) => ({ path: args.join("/") }));
const serverTimestamp = jest.fn(() => ({ __ts: true }));

jest.mock("firebase/firestore", () => ({
  doc: (...args: unknown[]) => doc(...args),
  setDoc: (...args: unknown[]) => setDoc(...args),
  serverTimestamp: () => serverTimestamp(),
}));

jest.mock("@/features/auth/clientPortalConstants", () => ({
  CLIENT_PORTAL_PROFILE_COLLECTION: "client_portal_profiles",
}));

describe("ensureIvanaChatPortalProfile", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("écrit companyId sur le profil portail", async () => {
    const db = {} as import("firebase/firestore").Firestore;
    const user = { uid: "u1", email: "a@b.c", displayName: "A B" } as import("firebase/auth").User;

    await ensureIvanaChatPortalProfile(db, user, "co-abc");

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
    await ensureIvanaChatPortalProfile(db, user, "  ");
    expect(setDoc).not.toHaveBeenCalled();
  });
});
