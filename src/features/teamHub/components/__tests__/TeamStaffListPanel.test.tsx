import { fireEvent, render, screen, waitFor } from "@/test-utils/render";
import TeamStaffListPanel from "@/features/teamHub/components/TeamStaffListPanel";
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

describe("TeamStaffListPanel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("lists staff and opens edit panel", () => {
    render(
      <TeamStaffListPanel
        companyId="co-abc"
        staff={staff}
        loading={false}
        loadError={null}
        onRefresh={jest.fn().mockResolvedValue(undefined)}
      />
    );

    expect(screen.getByTestId("team-staff-row-uid-tech-1")).toBeInTheDocument();
    fireEvent.click(screen.getByTestId("team-staff-row-uid-tech-1"));
    expect(screen.getByTestId("team-staff-edit-first-name")).toHaveValue("Jean");
    expect(screen.getByTestId("team-staff-deactivate")).toBeInTheDocument();
  });

  it("conserve la saisie dans le formulaire", () => {
    render(
      <TeamStaffListPanel
        companyId="co-abc"
        staff={staff}
        loading={false}
        loadError={null}
        onRefresh={jest.fn().mockResolvedValue(undefined)}
      />
    );

    fireEvent.click(screen.getByTestId("team-staff-row-uid-tech-1"));
    const lastNameInput = screen.getByTestId("team-staff-edit-last-name");
    fireEvent.change(lastNameInput, { target: { value: "Dupont" } });
    expect(lastNameInput).toHaveValue("Dupont");
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

    render(
      <TeamStaffListPanel
        companyId="co-abc"
        staff={staff}
        loading={false}
        loadError={null}
        onRefresh={onRefresh}
      />
    );

    fireEvent.click(screen.getByTestId("team-staff-row-uid-tech-1"));
    fireEvent.change(screen.getByTestId("team-staff-edit-last-name"), {
      target: { value: "Dupont" },
    });
    fireEvent.click(screen.getByTestId("team-staff-save"));

    await waitFor(() =>
      expect(fetchWithAuth).toHaveBeenCalledWith(
        "/api/company/staff/uid-tech-1?companyId=co-abc",
        expect.objectContaining({
          method: "PATCH",
          body: JSON.stringify({
            firstName: "Jean",
            lastName: "Dupont",
            email: "jean@abc.be",
            vehicle: "Camionnette",
          }),
        })
      )
    );
    expect(onRefresh).toHaveBeenCalled();
  });
});
