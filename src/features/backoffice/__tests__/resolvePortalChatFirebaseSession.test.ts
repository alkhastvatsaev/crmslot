import { resolvePortalChatFirebaseSession } from "@/features/backoffice/resolvePortalChatFirebaseSession";

jest.mock("@/core/config/firebase", () => ({
  auth: { currentUser: { uid: "crm-uid" } },
  firestore: { app: "crm" },
  storage: { app: "crm-storage" },
  clientPortalAuth: { currentUser: null },
  clientPortalFirestore: { app: "portal" },
  clientPortalStorage: { app: "portal-storage" },
}));

describe("resolvePortalChatFirebaseSession", () => {
  it("utilise auth CRM pour l'inbox staff", () => {
    const session = resolvePortalChatFirebaseSession(false);
    expect(session.chatAuth).toEqual({ currentUser: { uid: "crm-uid" } });
    expect(session.chatDb).toEqual({ app: "crm" });
    expect(session.chatStorage).toEqual({ app: "crm-storage" });
  });

  it("utilise clientPortalAuth pour le portail demandeur (invité ou connecté)", () => {
    const session = resolvePortalChatFirebaseSession(true);
    expect(session.chatAuth).toEqual({ currentUser: null });
    expect(session.chatDb).toEqual({ app: "portal" });
    expect(session.chatStorage).toEqual({ app: "portal-storage" });
  });
});
