import {
  isClientPortalChatUser,
  isVerifiedClientPortalUser,
} from "@/features/auth/hooks/useClientPortalAccount";

describe("isClientPortalChatUser", () => {
  it("accepte un invité anonyme", () => {
    expect(
      isClientPortalChatUser({ uid: "a", isAnonymous: true, emailVerified: false } as never)
    ).toBe(true);
  });

  it("accepte un compte email vérifié", () => {
    expect(
      isClientPortalChatUser({ uid: "b", isAnonymous: false, emailVerified: true } as never)
    ).toBe(true);
  });

  it("refuse un compte email non vérifié", () => {
    expect(
      isClientPortalChatUser({ uid: "c", isAnonymous: false, emailVerified: false } as never)
    ).toBe(false);
  });

  it("reste distinct de isVerifiedClientPortalUser pour les anonymes", () => {
    const anon = { uid: "d", isAnonymous: true, emailVerified: false } as never;
    expect(isClientPortalChatUser(anon)).toBe(true);
    expect(isVerifiedClientPortalUser(anon)).toBe(false);
  });
});
