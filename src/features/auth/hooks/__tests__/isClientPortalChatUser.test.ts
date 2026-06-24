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
      isClientPortalChatUser({
        uid: "b",
        isAnonymous: false,
        email: "client@example.com",
        emailVerified: true,
      } as never)
    ).toBe(true);
  });

  it("accepte un compte email non vérifié pour le chat", () => {
    expect(
      isClientPortalChatUser({
        uid: "c",
        isAnonymous: false,
        email: "client@example.com",
        emailVerified: false,
      } as never)
    ).toBe(true);
  });

  it("refuse un compte sans email", () => {
    expect(
      isClientPortalChatUser({ uid: "e", isAnonymous: false, emailVerified: false } as never)
    ).toBe(false);
  });

  it("reste distinct de isVerifiedClientPortalUser pour les anonymes", () => {
    const anon = { uid: "d", isAnonymous: true, emailVerified: false } as never;
    expect(isClientPortalChatUser(anon)).toBe(true);
    expect(isVerifiedClientPortalUser(anon)).toBe(false);
  });
});
