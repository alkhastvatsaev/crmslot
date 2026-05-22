import { render, screen } from "@/test-utils/render";
import { getDefaultAssignedTechnicianUid } from "@/features/interventions/defaultAssignedTechnicianUid";
import type { Intervention } from "@/features/interventions/types";
import { useTechnicianAssignments } from "@/features/interventions/useTechnicianAssignments";
import TechnicianDashboardListPanel from "@/features/interventions/components/TechnicianDashboardListPanel";

const mockAssignments = useTechnicianAssignments as jest.MockedFunction<
  typeof useTechnicianAssignments
>;

jest.mock("@/features/interventions/useTechnicianAssignments", () => ({
  useTechnicianAssignments: jest.fn(),
}));

jest.mock("@/features/interventions/useTechnicianMissionDayAnchor", () => ({
  useTechnicianMissionDayAnchor: () => new Date("2026-05-16T12:00:00"),
}));

const techUid = getDefaultAssignedTechnicianUid();

const assignedOffer: Intervention = {
  id: "offer-42",
  title: "Chaudière",
  address: "Rue test",
  time: "10:00",
  status: "assigned",
  assignedTechnicianUid: techUid,
  scheduledDate: "2030-06-01",
  scheduledTime: "09:00",
  clientFirstName: "Jean",
  clientLastName: "Martin",
  location: { lat: 50.8, lng: 4.35 },
};

describe("TechnicianDashboardListPanel", () => {
  beforeEach(() => {
    mockAssignments.mockReturnValue({
      interventions: [assignedOffer],
      loading: false,
      error: null,
      firebaseUid: techUid,
    });
  });

  it("shows assignment offer card for assigned mission awaiting response", () => {
    render(
      <TechnicianDashboardListPanel selectedCaseId={null} onSelect={jest.fn()} />,
    );

    expect(screen.getByTestId("technician-dashboard-list")).toBeInTheDocument();
    expect(screen.getByTestId("technician-assignment-offer-offer-42")).toBeInTheDocument();
    expect(screen.queryByTestId("technician-assignment-accept")).not.toBeInTheDocument();
    expect(screen.queryByTestId("technician-assignment-decline")).not.toBeInTheDocument();
  });

  it("does not show offer UI when there are no released assignments", () => {
    mockAssignments.mockReturnValue({
      interventions: [],
      loading: false,
      error: null,
      firebaseUid: techUid,
    });

    render(
      <TechnicianDashboardListPanel selectedCaseId={null} onSelect={jest.fn()} />,
    );

    expect(screen.queryByTestId(/^technician-assignment-offer-/)).not.toBeInTheDocument();
  });
});
