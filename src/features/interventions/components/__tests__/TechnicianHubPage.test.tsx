import { fireEvent, render, screen, waitFor } from "@/test-utils/render";
import TechnicianHubPage from "@/features/interventions/components/TechnicianHubPage";
import { useTechnicianAssignments } from "@/features/interventions/useTechnicianAssignments";
import { DateProvider, useDateContext } from "@/context/DateContext";
import type { Intervention } from "@/features/interventions/types";

jest.mock("@/features/interventions/useTechnicianAssignments", () => ({
  useTechnicianAssignments: jest.fn(),
}));

jest.mock("@/features/interventions/useTechnicianMissionDayAnchor", () => ({
  useTechnicianMissionDayAnchor: jest.requireActual(
    "@/features/interventions/useTechnicianMissionDayAnchor"
  ).useTechnicianMissionDayAnchor,
}));

jest.mock("@/context/TechnicianCaseIntentContext", () => ({
  useTechnicianCaseIntent: () => ({
    pendingCaseId: null,
    setPendingCaseId: jest.fn(),
  }),
}));

const mockSetFinishJob = jest.fn();
jest.mock("@/context/TechnicianFinishJobContext", () => ({
  useTechnicianFinishJob: () => ({
    finishJobInterventionId: null,
    setFinishJobInterventionId: mockSetFinishJob,
  }),
}));

jest.mock("@/features/dashboard/hooks/useIsMobile", () => ({
  useIsMobile: () => false,
}));

const mockAssignments = useTechnicianAssignments as jest.MockedFunction<
  typeof useTechnicianAssignments
>;

function HubWithDateControls({ slotIndex }: { slotIndex: number }) {
  const { setSelectedDate } = useDateContext();
  return (
    <>
      <button
        type="button"
        data-testid="pick-tomorrow"
        onClick={() => setSelectedDate(new Date("2026-05-17T12:00:00"))}
      >
        Demain
      </button>
      <TechnicianHubPage slotIndex={slotIndex} />
    </>
  );
}

describe("TechnicianHubPage", () => {
  beforeEach(() => {
    mockAssignments.mockReturnValue({
      interventions: [],
      loading: false,
      error: null,
      firebaseUid: "tech-uid",
    });
  });

  it("renders missions layout with detail view by default", () => {
    render(<TechnicianHubPage slotIndex={2} />);

    expect(screen.getByTestId("dashboard-pager-slot-2")).toBeInTheDocument();
    expect(screen.getByTestId("daily-missions-empty-grid")).toBeInTheDocument();
    expect(screen.getByTestId("technician-dashboard-detail-empty")).toBeInTheDocument();
    expect(document.getElementById("technician-hub-missions")).toHaveAttribute(
      "data-technician-center-view",
      "detail"
    );
    expect(screen.queryByTestId("finish-job-panel")).not.toBeInTheDocument();
    expect(screen.queryByTestId("technician-offline-sync-panel")).not.toBeInTheDocument();
    expect(screen.queryByTestId("technician-hub-vehicle-stock")).not.toBeInTheDocument();
  });

  it("filters missions when calendar day changes", async () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2026-05-16T12:00:00"));

    const techUid = "tech-uid";
    const todayMission: Intervention = {
      id: "iv-today",
      title: "Aujourd'hui",
      address: "Rue 1",
      time: "10:00",
      status: "en_route",
      assignedTechnicianUid: techUid,
      technicianAcceptedAt: "2026-05-16T08:00:00.000Z",
      scheduledDate: "2026-05-16",
      scheduledTime: "10:00",
      clientFirstName: "Jean",
      clientLastName: "Aujourd",
      location: { lat: 50.8, lng: 4.35 },
    };
    const tomorrowMission: Intervention = {
      id: "iv-tomorrow",
      title: "Demain",
      address: "Rue 2",
      time: "11:00",
      status: "en_route",
      assignedTechnicianUid: techUid,
      technicianAcceptedAt: "2026-05-15T08:00:00.000Z",
      scheduledDate: "2026-05-17",
      scheduledTime: "11:00",
      clientFirstName: "Marie",
      clientLastName: "Demain",
      location: { lat: 50.8, lng: 4.35 },
    };

    mockAssignments.mockReturnValue({
      interventions: [todayMission, tomorrowMission],
      loading: false,
      error: null,
      firebaseUid: techUid,
    });

    render(
      <DateProvider>
        <HubWithDateControls slotIndex={2} />
      </DateProvider>
    );

    expect(screen.getByTestId("daily-mission-iv-today")).toBeInTheDocument();
    expect(screen.getByTestId("daily-mission-iv-tomorrow")).toBeInTheDocument();

    fireEvent.click(screen.getByTestId("pick-tomorrow"));

    await waitFor(() => {
      expect(screen.getByTestId("daily-mission-iv-tomorrow")).toBeInTheDocument();
    });
    expect(screen.queryByTestId("daily-mission-iv-today")).not.toBeInTheDocument();

    jest.useRealTimers();
  });
});
