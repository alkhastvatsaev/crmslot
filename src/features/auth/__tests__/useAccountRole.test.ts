import { renderHook, waitFor } from "@testing-library/react";
import { useAccountRole } from "@/features/auth/useAccountRole";
import { mockState } from "@/test-utils/mockState";

jest.mock("@/core/config/devUiPreview", () => ({
  devUiPreviewEnabled: false,
  DEMO_COMPANY_ID: "demo-co",
  DEMO_TECHNICIAN_UID: "demo-tech",
}));

jest.mock("@/core/config/firebase", () => ({
  isConfigured: true,
  auth: {} as object,
  firestore: {} as object,
}));

describe("useAccountRole", () => {
  beforeEach(() => {
    mockState.reset();
  });

  it("renvoie role=admin par défaut quand aucun doc technicien ne matche", async () => {
    mockState.firestoreData["technicians"] = [];
    const { result } = renderHook(() => useAccountRole());

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.role).toBe("admin");
    expect(result.current.isTechnicianAccount).toBe(false);
  });

  it("renvoie role=technician quand le UID est référencé dans technicians", async () => {
    mockState.firestoreData["technicians"] = [
      { id: "tech-1", authUid: (mockState.currentUser as { uid: string }).uid },
    ];
    const { result } = renderHook(() => useAccountRole());

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.role).toBe("technician");
    expect(result.current.isTechnicianAccount).toBe(true);
    expect(result.current.isCrmTenantAccount).toBe(false);
  });

  it("garde role=admin pour un tenant CRM même s'il est aussi technicien", async () => {
    const uid = (mockState.currentUser as { uid: string }).uid;
    mockState.firestoreData["technicians"] = [{ id: "tech-1", authUid: uid }];
    mockState.firestoreData[`users/${uid}/company_memberships`] = [{ id: "co-1", role: "admin" }];
    const { result } = renderHook(() => useAccountRole());

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.role).toBe("admin");
    expect(result.current.isCrmTenantAccount).toBe(true);
    expect(result.current.isTechnicianAccount).toBe(false);
    expect(result.current.isClientPortalAccount).toBe(false);
  });

  it("n'active pas le portail client pour un tenant avec profil client_portal_profiles", async () => {
    const uid = (mockState.currentUser as { uid: string }).uid;
    mockState.firestoreDocs[`client_portal_profiles/${uid}`] = { role: "client" };
    mockState.firestoreData[`users/${uid}/company_memberships`] = [{ id: "co-1", role: "admin" }];
    const { result } = renderHook(() => useAccountRole());

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.role).toBe("admin");
    expect(result.current.isClientPortalAccount).toBe(false);
  });

  it("renvoie role=unknown si pas d'utilisateur connecté", async () => {
    mockState.currentUser = null;
    const { result } = renderHook(() => useAccountRole());

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.role).toBe("unknown");
    expect(result.current.isTechnicianAccount).toBe(false);
  });
});
