import { resolveIvanaChatFirebaseSession } from "@/features/backoffice/resolveIvanaChatFirebaseSession";

jest.mock("@/core/config/firebase", () => ({
  auth: { currentUser: { uid: "crm-uid" } },
  firestore: { app: "crm" },
  clientPortalAuth: { currentUser: null },
  clientPortalFirestore: { app: "portal" },
}));

describe("resolveIvanaChatFirebaseSession", () => {
  it("utilise auth CRM pour l'inbox staff", () => {
    const session = resolveIvanaChatFirebaseSession(false);
    expect(session.chatAuth).toEqual({ currentUser: { uid: "crm-uid" } });
    expect(session.chatDb).toEqual({ app: "crm" });
  });

  it("utilise clientPortalAuth pour le portail demandeur (invité ou connecté)", () => {
    const session = resolveIvanaChatFirebaseSession(true);
    expect(session.chatAuth).toEqual({ currentUser: null });
    expect(session.chatDb).toEqual({ app: "portal" });
  });
});
