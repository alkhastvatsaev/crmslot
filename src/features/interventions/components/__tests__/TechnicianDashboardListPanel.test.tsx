import { render, screen, fireEvent, waitFor } from "@/test-utils/render";
import { getDefaultAssignedTechnicianUid } from "@/features/interventions/defaultAssignedTechnicianUid";
import type { Intervention } from "@/features/interventions/types";
import { useTechnicianAssignments } from "@/features/interventions/useTechnicianAssignments";
import TechnicianDashboardListPanel from "@/features/interventions/components/TechnicianDashboardListPanel";
import { reopenTechnicianCompletedIntervention } from "@/features/interventions/technicianReopenCompletedIntervention";

const mockAssignments = useTechnicianAssignments as jest.MockedFunction<
  typeof useTechnicianAssignments
>;

jest.mock("@/features/interventions/useTechnicianAssignments", () => ({
  useTechnicianAssignments: jest.fn(),
}));

jest.mock("@/features/interventions/useTechnicianMissionDayAnchor", () => ({
  useTechnicianMissionDayAnchor: () => new Date("2026-05-16T12:00:00"),
}));

jest.mock("@/features/interventions/technicianReopenCompletedIntervention", () => ({
  ...jest.requireActual("@/features/interventions/technicianReopenCompletedIntervention"),
  reopenTechnicianCompletedIntervention: jest.fn().mockResolvedValue(undefined),
}));

const mockReopen = reopenTechnicianCompletedIntervention as jest.MockedFunction<
  typeof reopenTechnicianCompletedIntervention
>;

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

const doneArchived: Intervention = {
  id: "done-99",
  title: "Radiateur",
  address: "Rue archivée",
  time: "14:00",
  status: "done",
  assignedTechnicianUid: techUid,
  scheduledDate: "2026-05-16",
  scheduledTime: "14:00",
  clientFirstName: "Marie",
  clientLastName: "Dupont",
  location: { lat: 50.8, lng: 4.35 },
};

describe("TechnicianDashboardListPanel", () => {
  beforeEach(() => {
    mockReopen.mockClear();
    jest.spyOn(window, "confirm").mockReturnValue(true);
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

  it("shows reopen control for done archived missions and calls reopen helper", async () => {
    const onSelect = jest.fn();
    mockAssignments.mockReturnValue({
      interventions: [doneArchived],
      loading: false,
      error: null,
      firebaseUid: techUid,
    });

    render(<TechnicianDashboardListPanel selectedCaseId={null} onSelect={onSelect} />);

    fireEvent.click(screen.getByTestId("technician-dashboard-archives-toggle"));

    const reopenBtn = await screen.findByTestId("technician-case-reopen-done-99");
    expect(reopenBtn).toBeInTheDocument();
    fireEvent.click(reopenBtn);

    await waitFor(() => {
      expect(mockReopen).toHaveBeenCalledWith(
        expect.objectContaining({ iv: expect.objectContaining({ id: "done-99" }) }),
      );
    });
    expect(onSelect).toHaveBeenCalledWith("done-99");
  });

  it("does not show reopen when invoice PDF exists on done mission", async () => {
    mockAssignments.mockReturnValue({
      interventions: [{ ...doneArchived, id: "done-pdf", invoicePdfUrl: "https://storage/x.pdf" }],
      loading: false,
      error: null,
      firebaseUid: techUid,
    });

    render(<TechnicianDashboardListPanel selectedCaseId={null} onSelect={jest.fn()} />);

    fireEvent.click(screen.getByTestId("technician-dashboard-archives-toggle"));

    expect(screen.queryByTestId("technician-case-reopen-done-pdf")).not.toBeInTheDocument();
  });

  it("does not show reopen for invoiced archived missions", async () => {
    mockAssignments.mockReturnValue({
      interventions: [{ ...doneArchived, id: "inv-1", status: "invoiced" }],
      loading: false,
      error: null,
      firebaseUid: techUid,
    });

    render(<TechnicianDashboardListPanel selectedCaseId={null} onSelect={jest.fn()} />);

    fireEvent.click(screen.getByTestId("technician-dashboard-archives-toggle"));

    expect(screen.queryByTestId("technician-case-reopen-inv-1")).not.toBeInTheDocument();
  });
});
