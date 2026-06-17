import { resolveIvanaChatFirebaseSession } from "@/features/backoffice/resolveIvanaChatFirebaseSession";

jest.mock("@/core/config/firebase", () => ({
  auth: { currentUser: { uid: "crm-uid" } },
  firestore: { app: "crm" },
  clientPortalAuth: { currentUser: { uid: "portal-uid", emailVerified: true, isAnonymous: false } },
  clientPortalFirestore: { app: "portal" },
}));

jest.mock("@/features/auth/hooks/useClientPortalAccount", () => ({
  isVerifiedClientPortalUser: (user: { emailVerified?: boolean; isAnonymous?: boolean } | null) =>
    Boolean(user && !user.isAnonymous && user.emailVerified),
}));

describe("resolveIvanaChatFirebaseSession", () => {
  it("utilise auth CRM pour l'inbox staff", () => {
    const session = resolveIvanaChatFirebaseSession(false);
    expect(session.chatAuth).toEqual({ currentUser: { uid: "crm-uid" } });
    expect(session.chatDb).toEqual({ app: "crm" });
  });

  it("utilise clientPortalAuth quand publishAsPortal et compte client vérifié", () => {
    const session = resolveIvanaChatFirebaseSession(true);
    expect(session.chatAuth).toEqual({
      currentUser: { uid: "portal-uid", emailVerified: true, isAnonymous: false },
    });
    expect(session.chatDb).toEqual({ app: "portal" });
  });
});
