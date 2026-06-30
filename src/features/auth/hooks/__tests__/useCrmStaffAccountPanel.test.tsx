import React from "react";
import { act, renderHook, waitFor } from "@testing-library/react";
import { I18nProvider } from "@/core/i18n/I18nContext";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { onSnapshot } from "firebase/firestore";
import { toast } from "sonner";
import { useCrmStaffAccountPanel } from "@/features/auth/hooks/useCrmStaffAccountPanel";
import { deleteStaffAccount, saveStaffAccountProfile } from "@/features/auth/staffAccountProfile";

jest.mock("@/context/CompanyWorkspaceContext", () => ({
  useCompanyWorkspaceOptional: jest.fn(),
}));

jest.mock("@/features/auth/staffAccountProfile", () => ({
  saveStaffAccountProfile: jest.fn(),
  deleteStaffAccount: jest.fn(),
}));

jest.mock("sonner", () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}));

import { useCompanyWorkspaceOptional } from "@/context/CompanyWorkspaceContext";

const workspaceMock = useCompanyWorkspaceOptional as jest.MockedFunction<
  typeof useCompanyWorkspaceOptional
>;
const saveStaffMock = saveStaffAccountProfile as jest.MockedFunction<
  typeof saveStaffAccountProfile
>;
const deleteStaffMock = deleteStaffAccount as jest.MockedFunction<typeof deleteStaffAccount>;
const onAuthChangedMock = onAuthStateChanged as jest.MockedFunction<typeof onAuthStateChanged>;
const onSnapshotMock = onSnapshot as jest.MockedFunction<typeof onSnapshot>;
const signOutMock = signOut as jest.MockedFunction<typeof signOut>;

const staffUser = {
  uid: "uid-staff",
  email: "staff@test.com",
  displayName: "Jean Dupont",
} as import("firebase/auth").User;

function hookWrapper({ children }: { children: React.ReactNode }) {
  return <I18nProvider>{children}</I18nProvider>;
}

describe("useCrmStaffAccountPanel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    workspaceMock.mockReturnValue({
      memberships: [{ companyId: "co-1", companyName: "Test Co", role: "admin" }],
      activeCompanyId: "co-1",
      activeRole: "admin",
      setActiveCompanyId: jest.fn(),
      refreshClaimsSilent: jest.fn().mockResolvedValue(true),
    } as unknown as ReturnType<typeof useCompanyWorkspaceOptional>);
    onAuthChangedMock.mockImplementation((_auth, next) => {
      const cb = typeof next === "function" ? next : next.next;
      cb?.(staffUser);
      return jest.fn();
    });
    onSnapshotMock.mockImplementation((_ref, onNext) => {
      (onNext as (snap: unknown) => void)({ exists: () => false, data: () => ({}) });
      return jest.fn();
    });
    saveStaffMock.mockResolvedValue({
      firstName: "Jean",
      lastName: "Dupont",
      email: "staff@test.com",
      phone: "",
      companyId: "co-1",
      accountRole: "dispatcher",
    });
  });

  it("expose ready:false sans utilisateur auth", () => {
    onAuthChangedMock.mockImplementation((_auth, next) => {
      const cb = typeof next === "function" ? next : next.next;
      cb?.(null);
      return jest.fn();
    });

    const { result } = renderHook(() => useCrmStaffAccountPanel(), { wrapper: hookWrapper });
    expect(result.current.ready).toBe(false);
  });

  it("remplit fields depuis auth + workspace", async () => {
    const { result } = renderHook(() => useCrmStaffAccountPanel(), { wrapper: hookWrapper });

    await waitFor(() => {
      expect(result.current.ready).toBe(true);
      expect(result.current.fields.email).toBe("staff@test.com");
      expect(result.current.fields.companyId).toBe("co-1");
      expect(result.current.fields.firstName).toBe("Jean");
    });
  });

  // Régression : pas de snapshot Firestore sans uid — 2026-06-30
  it("ne souscrit pas Firestore technicians sans utilisateur", () => {
    onAuthChangedMock.mockImplementation((_auth, next) => {
      const cb = typeof next === "function" ? next : next.next;
      cb?.(null);
      return jest.fn();
    });

    renderHook(() => useCrmStaffAccountPanel(), { wrapper: hookWrapper });
    expect(onSnapshotMock).not.toHaveBeenCalled();
  });

  it("startEditing active le mode édition avec un draft cohérent", async () => {
    const { result } = renderHook(() => useCrmStaffAccountPanel(), { wrapper: hookWrapper });

    await waitFor(() => expect(result.current.ready).toBe(true));

    act(() => {
      result.current.startEditing();
    });

    expect(result.current.editing).toBe(true);
    expect(result.current.draft.email).toBe("staff@test.com");
    expect(result.current.draft.companyId).toBe("co-1");
  });

  it("handleSave appelle saveStaffAccountProfile", async () => {
    const { result } = renderHook(() => useCrmStaffAccountPanel(), { wrapper: hookWrapper });

    await waitFor(() => expect(result.current.ready).toBe(true));

    act(() => {
      result.current.startEditing();
      result.current.updateDraft({ phone: "+32 2" });
    });

    await act(async () => {
      await result.current.handleSave();
    });

    expect(saveStaffMock).toHaveBeenCalledWith(
      staffUser,
      expect.objectContaining({ phone: "+32 2", companyId: "co-1" }),
      expect.objectContaining({ previousCompanyId: "co-1" })
    );
    expect(result.current.editing).toBe(false);
    expect(toast.success).toHaveBeenCalled();
  });

  it("handleDeleteAccount respecte le confirm utilisateur", async () => {
    const confirmSpy = jest.spyOn(window, "confirm").mockReturnValue(false);
    const { result } = renderHook(() => useCrmStaffAccountPanel(), { wrapper: hookWrapper });

    await waitFor(() => expect(result.current.ready).toBe(true));

    await act(async () => {
      await result.current.handleDeleteAccount();
    });

    expect(deleteStaffMock).not.toHaveBeenCalled();
    confirmSpy.mockRestore();
  });

  it("handleSignOut appelle signOut", async () => {
    signOutMock.mockResolvedValue();
    const { result } = renderHook(() => useCrmStaffAccountPanel(), { wrapper: hookWrapper });

    await waitFor(() => expect(result.current.ready).toBe(true));

    await act(async () => {
      await result.current.handleSignOut();
    });

    expect(signOutMock).toHaveBeenCalled();
  });
});
