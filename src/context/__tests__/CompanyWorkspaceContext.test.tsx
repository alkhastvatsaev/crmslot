import React from "react";
import { render, screen, waitFor, act } from "@testing-library/react";
import { CompanyWorkspaceProvider, useCompanyWorkspace } from "@/context/CompanyWorkspaceContext";
import { mockState } from "@/test-utils/mockState";
import { onSnapshot } from "firebase/firestore";

const mockOnSnapshot = onSnapshot as jest.MockedFunction<typeof onSnapshot>;

function Consumer() {
  const ctx = useCompanyWorkspace();
  return (
    <div>
      <span data-testid="company-id">{ctx.activeCompanyId || "empty"}</span>
      <span data-testid="is-tenant">{String(ctx.isTenantUser)}</span>
      <span data-testid="workspace-ready">{String(ctx.workspaceReady)}</span>
    </div>
  );
}

describe("CompanyWorkspaceContext", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    mockState.reset();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("n'expose pas demo-local-company quand l'utilisateur est authentifié sans abonnements", async () => {
    // User is authenticated (mockState.currentUser set by default), but no memberships
    mockState.firestoreData["users/mock-user-123/company_memberships"] = [];

    render(
      <CompanyWorkspaceProvider>
        <Consumer />
      </CompanyWorkspaceProvider>
    );

    // Flush the setTimeout(10) in the memberships effect
    await act(async () => {
      jest.advanceTimersByTime(20);
    });

    await waitFor(() => {
      // Should NOT be demo-local-company — user is authenticated
      expect(screen.getByTestId("company-id").textContent).toBe("empty");
      expect(screen.getByTestId("is-tenant").textContent).toBe("false");
    });
  });

  it("expose le companyId de l'abonnement quand l'utilisateur a des sociétés", async () => {
    mockState.firestoreData["users/mock-user-123/company_memberships"] = [
      { id: "company-abc", role: "admin", companyName: "Société ABC" },
    ];
    mockState.firestoreDocs["companies/company-abc"] = { name: "Société ABC" };

    render(
      <CompanyWorkspaceProvider>
        <Consumer />
      </CompanyWorkspaceProvider>
    );

    await act(async () => {
      jest.advanceTimersByTime(20);
    });

    await waitFor(() => {
      expect(screen.getByTestId("company-id").textContent).toBe("company-abc");
      expect(screen.getByTestId("is-tenant").textContent).toBe("true");
    });
  });

  it("ne souscrit pas Firestore avant l'auth (authLoading)", () => {
    window.localStorage.removeItem("crmslot_active_company_id");
    const { onAuthStateChanged } = jest.requireMock("firebase/auth") as {
      onAuthStateChanged: jest.Mock;
    };
    onAuthStateChanged.mockImplementationOnce(() => jest.fn());

    render(
      <CompanyWorkspaceProvider>
        <Consumer />
      </CompanyWorkspaceProvider>
    );

    expect(mockOnSnapshot).not.toHaveBeenCalled();
    expect(screen.getByTestId("workspace-ready").textContent).toBe("false");
    expect(screen.getByTestId("company-id").textContent).toBe("empty");
  });

  it("purge un activeCompanyId localStorage périmé quand il n'y a plus de société", async () => {
    window.localStorage.setItem("crmslot_active_company_id", "company-abc");
    mockState.firestoreData["users/mock-user-123/company_memberships"] = [];

    render(
      <CompanyWorkspaceProvider>
        <Consumer />
      </CompanyWorkspaceProvider>
    );

    await act(async () => {
      jest.advanceTimersByTime(20);
    });

    await waitFor(() => {
      expect(screen.getByTestId("workspace-ready").textContent).toBe("true");
      expect(screen.getByTestId("company-id").textContent).toBe("empty");
      expect(screen.getByTestId("is-tenant").textContent).toBe("false");
      expect(window.localStorage.getItem("crmslot_active_company_id")).toBeNull();
    });
  });

  it("bascule vers une société valide si l'ancienne membership ABC a été supprimée", async () => {
    window.localStorage.setItem("crmslot_active_company_id", "company-abc");
    mockState.firestoreData["users/mock-user-123/company_memberships"] = [
      { id: "company-abc", role: "admin", companyName: "ABC" },
      { id: "company-antwerp", role: "admin", companyName: "ABC" },
    ];
    mockState.firestoreDocs["companies/company-abc"] = null;
    mockState.firestoreDocs["companies/company-antwerp"] = { name: "AntwerpenSlot" };

    render(
      <CompanyWorkspaceProvider>
        <Consumer />
      </CompanyWorkspaceProvider>
    );

    await act(async () => {
      jest.advanceTimersByTime(20);
    });

    await waitFor(() => {
      expect(screen.getByTestId("company-id").textContent).toBe("company-antwerp");
      expect(screen.getByTestId("is-tenant").textContent).toBe("true");
    });
  });
});
