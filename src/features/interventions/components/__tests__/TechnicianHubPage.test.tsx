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

  it("renders mobile hub with mission strip and empty detail", () => {
    render(<TechnicianHubPage slotIndex={2} />);

    expect(screen.getByTestId("technician-mobile-hub-2")).toHaveAttribute(
      "data-ui-version",
      "field-v2"
    );
    expect(screen.getByTestId("technician-mobile-day-strip-empty")).toBeInTheDocument();
    expect(screen.getByTestId("technician-mobile-mission-empty")).toBeInTheDocument();
    expect(document.getElementById("technician-hub-missions")).toHaveAttribute(
      "data-technician-center-view",
      "detail"
    );
    expect(screen.queryByTestId("finish-job-panel")).not.toBeInTheDocument();
    expect(screen.queryByTestId("daily-missions-empty-grid")).not.toBeInTheDocument();
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

    expect(screen.getByTestId("technician-mobile-mission-chip-iv-today")).toBeInTheDocument();
    expect(screen.getByTestId("technician-mobile-mission-chip-iv-tomorrow")).toBeInTheDocument();

    fireEvent.click(screen.getByTestId("pick-tomorrow"));

    await waitFor(() => {
      expect(screen.getByTestId("technician-mobile-mission-client")).toHaveTextContent(
        "Marie Demain"
      );
    });
    expect(screen.queryByTestId("technician-mobile-mission-chip-iv-today")).not.toBeInTheDocument();
    expect(
      screen.queryByTestId("technician-mobile-mission-chip-iv-tomorrow")
    ).not.toBeInTheDocument();

    jest.useRealTimers();
  });
});
