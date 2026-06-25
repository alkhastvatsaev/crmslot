import { render, screen, fireEvent } from "@/test-utils/render";
import TeamHubPage from "@/features/teamHub/components/TeamHubPage";
import { TEAM_HUB_SLOT_INDEX } from "@/features/teamHub/teamHubConstants";
import type { CompanyStaffMember } from "@/features/teamHub/types";

const staff: CompanyStaffMember[] = [
  {
    uid: "uid-tech-1",
    role: "collaborateur",
    email: "jean@abc.be",
    firstName: "Jean",
    lastName: "Martin",
    displayName: "Jean Martin",
    hasTechnicianProfile: true,
    active: true,
    authUid: "uid-tech-1",
    vehicle: "Camionnette",
  },
];

jest.mock("@/context/CompanyWorkspaceContext", () => ({
  useCompanyWorkspaceOptional: () => ({
    activeCompanyId: "co-demo",
    activeRole: "admin",
    workspaceReady: true,
  }),
}));

jest.mock("@/features/teamHub/hooks/useCompanyStaff", () => ({
  useCompanyStaff: () => ({
    staff,
    loading: false,
    error: null,
    refresh: jest.fn().mockResolvedValue(undefined),
  }),
}));

jest.mock("@/features/teamHub/hooks/useCreateCompanyStaff", () => ({
  useCreateCompanyStaff: () => ({
    busy: false,
    error: null,
    lastResult: null,
    createMember: jest.fn(),
    clearFeedback: jest.fn(),
  }),
  COMPANY_STAFF_KIND_OPTIONS: ["dirigeant", "dispatcher", "technician"],
}));

describe("TeamHubPage premium patron", () => {
  it("shows add member panel for admins and staff grid", () => {
    render(<TeamHubPage slotIndex={TEAM_HUB_SLOT_INDEX} />, { pageCount: 9 });

    expect(screen.getByTestId("team-hub-add-member-panel")).toBeInTheDocument();
    expect(screen.getByTestId("team-hub-staff-grid")).toBeInTheDocument();
    expect(screen.getByTestId("team-staff-row-uid-tech-1")).toBeInTheDocument();
    expect(screen.getByText("Jean")).toBeInTheDocument();
    expect(screen.getByText("Martin")).toBeInTheDocument();
  });

  it("opens right panel on staff click", () => {
    render(<TeamHubPage slotIndex={TEAM_HUB_SLOT_INDEX} />, { pageCount: 9 });

    fireEvent.click(screen.getByTestId("team-staff-row-uid-tech-1"));
    expect(screen.getByTestId("team-staff-edit-first-name")).toHaveValue("Jean");
  });
});
