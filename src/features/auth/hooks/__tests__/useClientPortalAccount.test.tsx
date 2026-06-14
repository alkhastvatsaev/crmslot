import React from "react";
import { act, waitFor } from "@testing-library/react";
import { onAuthStateChanged } from "firebase/auth";
import { toast } from "sonner";
import { renderHook } from "@testing-library/react";
import { saveClientPortalAccountFields } from "@/features/auth/clientPortalAccountProfile";
import { useClientPortalAccount } from "@/features/auth/hooks/useClientPortalAccount";
import { RequesterHubProvider } from "@/features/interventions/context/RequesterHubContext";
import { I18nProvider } from "@/core/i18n/I18nContext";

jest.mock("@/features/auth/clientPortalAccountProfile", () => {
  const actual = jest.requireActual("@/features/auth/clientPortalAccountProfile");
  return {
    ...actual,
    loadClientPortalAccountFields: jest.fn(() =>
      Promise.resolve({
        firstName: "",
        lastName: "",
        email: "client@test.example",
        phone: "",
        address: "",
      })
    ),
    saveClientPortalAccountFields: jest.fn(() => Promise.resolve()),
  };
});

jest.mock("sonner", () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}));

const mockSave = saveClientPortalAccountFields as jest.MockedFunction<
  typeof saveClientPortalAccountFields
>;

function verifiedUser() {
  return {
    uid: "portal-user-1",
    email: "client@test.example",
    emailVerified: true,
    isAnonymous: false,
  };
}

describe("useClientPortalAccount", () => {
  beforeEach(() => {
    mockSave.mockClear();
    (toast.success as jest.Mock).mockClear();
    (onAuthStateChanged as jest.Mock).mockImplementation((_auth, cb) => {
      cb(verifiedUser());
      return jest.fn();
    });
  });

  it("persists the latest edited field values on blur (no stale closure)", async () => {
    const { result } = renderHook(() => useClientPortalAccount(), {
      wrapper: ({ children }) => (
        <I18nProvider>
          <RequesterHubProvider>{children}</RequesterHubProvider>
        </I18nProvider>
      ),
    });

    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => {
      result.current.updateField("firstName", "Pierre");
      result.current.updateField("lastName", "Martin");
    });

    await act(async () => {
      await result.current.persistAccount();
    });

    expect(mockSave).toHaveBeenCalledWith("portal-user-1", {
      firstName: "Pierre",
      lastName: "Martin",
      email: "client@test.example",
      phone: "",
      address: "",
    });
    expect(toast.success).toHaveBeenCalled();
  });
});
