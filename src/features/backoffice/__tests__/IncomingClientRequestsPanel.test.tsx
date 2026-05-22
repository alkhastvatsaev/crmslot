import { fireEvent, waitFor } from "@testing-library/react";
import { render, screen } from "@/test-utils/render";
import { assignInterventionFromBackoffice } from "@/features/backoffice/assignInterventionFromBackoffice";
import { useCompanyWorkspaceOptional } from "@/context/CompanyWorkspaceContext";
import { useBackOfficeInterventions } from "@/features/backoffice/useBackOfficeInterventions";
import { getDefaultAssignedTechnicianUid } from "@/features/interventions/defaultAssignedTechnicianUid";
import type { Intervention } from "@/features/interventions/types";
import IncomingClientRequestsPanel from "@/features/backoffice/components/IncomingClientRequestsPanel";

jest.mock("@/features/backoffice/assignInterventionFromBackoffice", () => ({
  assignInterventionFromBackoffice: jest.fn(async () => undefined),
}));

const mockAssign = assignInterventionFromBackoffice as jest.MockedFunction<
  typeof assignInterventionFromBackoffice
>;
const mockWorkspace = useCompanyWorkspaceOptional as jest.MockedFunction<
  typeof useCompanyWorkspaceOptional
>;
const mockUseBackOffice = useBackOfficeInterventions as jest.MockedFunction<
  typeof useBackOfficeInterventions
>;

jest.mock("@/context/CompanyWorkspaceContext", () => ({
  useCompanyWorkspaceOptional: jest.fn(),
}));

jest.mock("@/features/backoffice/useBackOfficeInterventions", () => ({
  useBackOfficeInterventions: jest.fn(),
}));

jest.mock("@/features/backoffice/useResolvedInterventionAudio", () => ({
  useResolvedInterventionAudio: jest.fn(() => ({ resolvedAudioUrl: null })),
}));

jest.mock("@/features/technicians/hooks", () => ({
  useTechnicians: jest.fn(() => ({
    technicians: [
      {
        id: "mansour",
        name: "Mansour",
        initial: "M",
        vehicle: "Van",
        status: "available",
        authUid: getDefaultAssignedTechnicianUid(),
        location: { lat: 50.848, lng: 4.352 },
      },
    ],
    loading: false,
  })),
}));

jest.mock("@/features/dispatch/algorithm", () => ({
  findBestTechnician: jest.fn(async () => null),
}));

const pendingRequest: Intervention = {
  id: "req-1",
  title: "Fuite cuisine",
  address: "Rue de la Loi 1, Bruxelles",
  time: "10:00",
  status: "pending",
  location: { lat: 50.84, lng: 4.35 },
  clientFirstName: "Marie",
  clientLastName: "Dupont",
  createdAt: "2026-05-16T09:00:00.000Z",
};

function mockTenantWorkspace() {
  mockWorkspace.mockReturnValue({
    isTenantUser: true,
    activeCompanyId: "co-1",
    memberships: [{ companyId: "co-1", role: "owner" }],
    firebaseUid: "ivana-uid",
    setActiveCompanyId: jest.fn(),
    activeRole: "owner",
    refreshClaimsSilent: jest.fn(async () => true),
  } as unknown as NonNullable<ReturnType<typeof useCompanyWorkspaceOptional>>);
}

describe("IncomingClientRequestsPanel", () => {
  beforeEach(() => {
    mockAssign.mockClear();
    mockTenantWorkspace();
    mockUseBackOffice.mockReturnValue({
      interventions: [pendingRequest],
      loading: false,
      error: null,
      firebaseUid: "ivana-uid",
    });
  });

  it("shows gate when workspace is not a tenant", () => {
    mockWorkspace.mockReturnValue({
      isTenantUser: false,
      activeCompanyId: "",
      memberships: [],
      firebaseUid: null,
      setActiveCompanyId: jest.fn(),
      activeRole: null,
      refreshClaimsSilent: jest.fn(async () => false),
    } as unknown as NonNullable<ReturnType<typeof useCompanyWorkspaceOptional>>);

    render(<IncomingClientRequestsPanel />);

    expect(screen.getByTestId("incoming-requests-gate")).toBeInTheDocument();
    expect(screen.queryByTestId("incoming-requests-panel")).not.toBeInTheDocument();
  });

  it("assign writes status assigned with default technician uid", async () => {
    render(<IncomingClientRequestsPanel />);

    fireEvent.click(screen.getByTestId("incoming-request-card-req-1"));
    fireEvent.click(screen.getByTestId("incoming-request-assign"));

    const confirm = screen.getByTestId("technician-assign-confirm");
    await waitFor(() => expect(confirm).not.toBeDisabled());
    fireEvent.click(confirm);

    await waitFor(() => expect(mockAssign).toHaveBeenCalledTimes(1), { timeout: 3000 });
    expect(mockAssign.mock.calls[0]?.[0]).toBe("req-1");
    expect(mockAssign.mock.calls[0]?.[2]).toBe(getDefaultAssignedTechnicianUid());
  });
});
