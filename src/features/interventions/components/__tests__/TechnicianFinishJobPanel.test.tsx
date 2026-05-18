import { render, screen } from "@/test-utils/render";
import TechnicianFinishJobPanel from "@/features/interventions/components/TechnicianFinishJobPanel";
import { useTechnicianFinishJob } from "@/context/TechnicianFinishJobContext";
import { useInterventionLive } from "@/features/interventions/useInterventionLive";

jest.mock("@/context/TechnicianFinishJobContext", () => ({
  useTechnicianFinishJob: jest.fn(),
}));

jest.mock("@/features/interventions/useInterventionLive", () => ({
  useInterventionLive: jest.fn(),
}));

jest.mock("@/context/OfflineSyncContext", () => ({
  useOfflineSyncOptional: () => ({
    navigatorOnline: true,
    pendingCompletionCount: 0,
    isSyncing: false,
    lastFlushReport: null,
    flushNow: jest.fn(),
    refreshPendingCount: jest.fn(),
  }),
}));

const mockUseFinishJob = useTechnicianFinishJob as jest.MockedFunction<
  typeof useTechnicianFinishJob
>;
const mockUseInterventionLive = useInterventionLive as jest.MockedFunction<
  typeof useInterventionLive
>;

describe("TechnicianFinishJobPanel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders empty state when no intervention is active", () => {
    mockUseFinishJob.mockReturnValue({
      finishJobInterventionId: null,
      setFinishJobInterventionId: jest.fn(),
    });

    render(<TechnicianFinishJobPanel />);

    expect(screen.getByTestId("finish-job-empty")).toBeInTheDocument();
  });

  it("renders photo panel when intervention is active", () => {
    mockUseFinishJob.mockReturnValue({
      finishJobInterventionId: "test-iv-id",
      setFinishJobInterventionId: jest.fn(),
    });

    mockUseInterventionLive.mockReturnValue({
      id: "test-iv-id",
      clientName: "Dubois",
      category: "plomberie",
      problem: "Fuite d'eau",
      status: "in_progress",
    } as unknown as ReturnType<typeof mockUseInterventionLive>);

    render(<TechnicianFinishJobPanel />);

    expect(screen.getByTestId("finish-job-panel")).toBeInTheDocument();
  });
});
