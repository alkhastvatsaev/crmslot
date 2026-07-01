import {
  resolveRequesterSubmitClients,
  usesClientPortalSession,
} from "@/features/interventions/requesterInterventionSubmitClients";

jest.mock("@/core/config/firebase", () => ({
  auth: {},
  clientPortalAuth: {},
  firestore: { id: "main" },
  clientPortalFirestore: { id: "portal" },
  storage: { id: "main-storage" },
  clientPortalStorage: { id: "portal-storage" },
}));

describe("requesterInterventionSubmitClients", () => {
  it("uses portal session for login/register", () => {
    expect(usesClientPortalSession("login")).toBe(true);
    expect(usesClientPortalSession("register")).toBe(true);
    expect(usesClientPortalSession("particulier")).toBe(false);
  });

  it("routes login/register to clientPortalFirestore", () => {
    const user = { uid: "portal-uid" } as never;
    const clients = resolveRequesterSubmitClients("login", user);
    expect(clients?.db).toEqual({ id: "portal" });
    expect(clients?.storage).toEqual({ id: "portal-storage" });
  });

  it("routes particulier to main firestore", () => {
    const user = { uid: "anon-uid" } as never;
    const clients = resolveRequesterSubmitClients("particulier", user);
    expect(clients?.db).toEqual({ id: "main" });
    expect(clients?.storage).toEqual({ id: "main-storage" });
  });
});
