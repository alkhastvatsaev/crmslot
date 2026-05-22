import { render, screen } from "@/test-utils/render";
import TechnicianHubPage from "@/features/interventions/components/TechnicianHubPage";
import { useTechnicianAssignments } from "@/features/interventions/useTechnicianAssignments";

jest.mock("@/features/interventions/useTechnicianAssignments", () => ({
  useTechnicianAssignments: jest.fn(),
}));

jest.mock("@/features/interventions/useTechnicianMissionDayAnchor", () => ({
  useTechnicianMissionDayAnchor: () => new Date("2026-05-16T12:00:00"),
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

jest.mock("@/context/OfflineSyncContext", () => ({
  useOfflineSync: () => ({
    navigatorOnline: true,
    pendingCompletionCount: 0,
    isSyncing: false,
    lastFlushReport: null,
    flushNow: jest.fn(),
    refreshPendingCount: jest.fn(),
  }),
}));

const mockAssignments = useTechnicianAssignments as jest.MockedFunction<
  typeof useTechnicianAssignments
>;

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
    expect(screen.getByTestId("technician-dashboard-list")).toBeInTheDocument();
    expect(document.getElementById("technician-hub-missions")).toHaveAttribute(
      "data-technician-center-view",
      "detail",
    );
    expect(screen.queryByTestId("technician-finish-job-layer")).not.toBeInTheDocument();
  });
});
