import { signInAnonymously, signOut } from "firebase/auth";
import {
  isCrmTenantAuthUser,
  recoverMainAuthFromClientPortalLeak,
} from "@/features/auth/recoverMainAuthFromClientPortalLeak";

jest.mock("firebase/auth", () => ({
  signOut: jest.fn(async () => undefined),
  signInAnonymously: jest.fn(async () => ({ user: { uid: "anon", isAnonymous: true } })),
}));

const mockSignOut = signOut as jest.MockedFunction<typeof signOut>;
const mockSignInAnonymously = signInAnonymously as jest.MockedFunction<typeof signInAnonymously>;

describe("isCrmTenantAuthUser", () => {
  it("detects bmTenants claims", () => {
    expect(
      isCrmTenantAuthUser({ isAnonymous: false } as never, { bmTenants: ["co-1:admin"] })
    ).toBe(true);
    expect(isCrmTenantAuthUser({ isAnonymous: false } as never, { bmTenants: [] })).toBe(false);
  });
});

describe("recoverMainAuthFromClientPortalLeak", () => {
  beforeEach(() => {
    mockSignOut.mockClear();
    mockSignInAnonymously.mockClear();
  });

  it("signs out non-tenant users stuck on main auth", async () => {
    const user = {
      uid: "client-1",
      isAnonymous: false,
      getIdTokenResult: jest.fn(async () => ({ claims: {} })),
    };

    const recovered = await recoverMainAuthFromClientPortalLeak({} as never, user as never);

    expect(recovered).toBe(true);
    expect(mockSignOut).toHaveBeenCalled();
    expect(mockSignInAnonymously).toHaveBeenCalled();
  });

  it("keeps tenant admin sessions", async () => {
    const user = {
      uid: "admin-1",
      isAnonymous: false,
      getIdTokenResult: jest.fn(async () => ({ claims: { bmTenants: ["co-1:admin"] } })),
    };

    const recovered = await recoverMainAuthFromClientPortalLeak({} as never, user as never);

    expect(recovered).toBe(false);
    expect(mockSignOut).not.toHaveBeenCalled();
  });
});
