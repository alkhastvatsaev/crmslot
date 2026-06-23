import { resolvePortalChatFirebaseSession } from "@/features/backoffice/resolvePortalChatFirebaseSession";

jest.mock("@/core/config/firebase", () => ({
  auth: { currentUser: { uid: "crm-uid" } },
  firestore: { app: "crm" },
  clientPortalAuth: { currentUser: null },
  clientPortalFirestore: { app: "portal" },
}));

describe("resolvePortalChatFirebaseSession", () => {
  it("utilise auth CRM pour l'inbox staff", () => {
    const session = resolvePortalChatFirebaseSession(false);
    expect(session.chatAuth).toEqual({ currentUser: { uid: "crm-uid" } });
    expect(session.chatDb).toEqual({ app: "crm" });
  });

  it("utilise clientPortalAuth pour le portail demandeur (invité ou connecté)", () => {
    const session = resolvePortalChatFirebaseSession(true);
    expect(session.chatAuth).toEqual({ currentUser: null });
    expect(session.chatDb).toEqual({ app: "portal" });
  });
});
