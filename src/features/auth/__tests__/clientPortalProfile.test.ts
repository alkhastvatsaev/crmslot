import type { User } from "firebase/auth";
import { setDoc } from "firebase/firestore";
import {
  companyIdFromAllowedUsersDoc,
  syncClientPortalProfile,
} from "@/features/auth/clientPortalProfile";

jest.mock("@/core/config/firebase", () => ({
  isConfigured: true,
  clientPortalFirestore: {},
}));

jest.mock("firebase/firestore", () => ({
  doc: jest.fn(() => ({ path: "client_portal_profiles/uid-1" })),
  getDoc: jest.fn(async () => ({ exists: () => false })),
  serverTimestamp: jest.fn(() => ({ _serverTimestamp: true })),
  setDoc: jest.fn(async () => undefined),
}));

const mockSetDoc = setDoc as jest.MockedFunction<typeof setDoc>;

describe("companyIdFromAllowedUsersDoc", () => {
  it("prefers portalCompanyId then portalChatCompanyId then companyId", () => {
    expect(companyIdFromAllowedUsersDoc({ portalCompanyId: "co-a", companyId: "co-b" })).toBe(
      "co-a"
    );
    expect(companyIdFromAllowedUsersDoc({ portalChatCompanyId: "co-c" })).toBe("co-c");
    expect(companyIdFromAllowedUsersDoc({ companyId: "co-d" })).toBe("co-d");
    expect(companyIdFromAllowedUsersDoc({})).toBeNull();
  });
});

describe("syncClientPortalProfile", () => {
  beforeEach(() => {
    mockSetDoc.mockClear();
  });

  it("skips anonymous Firebase users", async () => {
    await syncClientPortalProfile({ uid: "anon", isAnonymous: true } as User);
    expect(mockSetDoc).not.toHaveBeenCalled();
  });

  it("writes profile for signed-in portal users", async () => {
    await syncClientPortalProfile({
      uid: "uid-1",
      isAnonymous: false,
      email: "client@example.be",
      displayName: "Client",
      photoURL: null,
    } as User);

    expect(mockSetDoc).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        uid: "uid-1",
        email: "client@example.be",
        role: "client",
      }),
      { merge: true }
    );
  });
});
