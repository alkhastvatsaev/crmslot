import { render, screen, fireEvent, waitFor } from "@/test-utils/render";
import TeamHubRightPanel from "@/features/teamHub/components/TeamHubRightPanel";
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

jest.mock("@/core/api/fetchWithAuth", () => ({
  fetchWithAuth: jest.fn(),
}));

describe("TeamHubRightPanel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("shows edit form when member selected", () => {
    render(
      <TeamHubRightPanel
        companyId="co-abc"
        staff={staff}
        selectedUid="uid-tech-1"
        onClearSelection={jest.fn()}
        onRefresh={jest.fn().mockResolvedValue(undefined)}
      />
    );

    expect(screen.getByTestId("team-staff-edit-first-name")).toHaveValue("Jean");
    expect(screen.getByTestId("team-staff-deactivate")).toBeInTheDocument();
  });

  it("saves profile via API", async () => {
    const { fetchWithAuth } = jest.requireMock("@/core/api/fetchWithAuth") as {
      fetchWithAuth: jest.Mock;
    };
    fetchWithAuth.mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true }),
    });
    const onRefresh = jest.fn().mockResolvedValue(undefined);
    const onClear = jest.fn();

    render(
      <TeamHubRightPanel
        companyId="co-abc"
        staff={staff}
        selectedUid="uid-tech-1"
        onClearSelection={onClear}
        onRefresh={onRefresh}
      />
    );

    fireEvent.change(screen.getByTestId("team-staff-edit-last-name"), {
      target: { value: "Dupont" },
    });
    fireEvent.click(screen.getByTestId("team-staff-save"));

    await waitFor(() =>
      expect(fetchWithAuth).toHaveBeenCalledWith(
        "/api/company/staff/uid-tech-1?companyId=co-abc",
        expect.objectContaining({ method: "PATCH" })
      )
    );
    expect(onRefresh).toHaveBeenCalled();
  });
});
