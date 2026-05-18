import { fireEvent, render, screen } from "@/test-utils/render";
import TechnicianOfflineSyncPanel from "@/features/offline/components/TechnicianOfflineSyncPanel";

const mockFlush = jest.fn();
const mockRefresh = jest.fn();

jest.mock("@/context/OfflineSyncContext", () => ({
  useOfflineSync: jest.fn(),
}));

jest.mock("@/features/interventions/useTechnicianAssignments", () => ({
  useTechnicianAssignments: () => ({ firebaseUid: "tech-123" }),
}));

import { useOfflineSync } from "@/context/OfflineSyncContext";

const mockUseOfflineSync = useOfflineSync as jest.MockedFunction<typeof useOfflineSync>;

describe("TechnicianOfflineSyncPanel", () => {
  beforeEach(() => {
    mockFlush.mockClear();
    mockUseOfflineSync.mockReturnValue({
      navigatorOnline: true,
      pendingCompletionCount: 2,
      isSyncing: false,
      lastFlushReport: null,
      flushNow: mockFlush,
      refreshPendingCount: mockRefresh,
    });
  });

  it("shows queue count and triggers flush", () => {
    render(<TechnicianOfflineSyncPanel />);

    expect(screen.getByTestId("technician-offline-sync-panel")).toBeInTheDocument();
    expect(screen.getByTestId("offline-sync-queue-count")).toHaveTextContent("2");

    fireEvent.click(screen.getByTestId("offline-sync-flush-btn"));
    expect(mockFlush).toHaveBeenCalledTimes(1);
  });

  it("shows conflict notice when last flush skipped conflicts", () => {
    mockUseOfflineSync.mockReturnValue({
      navigatorOnline: true,
      pendingCompletionCount: 0,
      isSyncing: false,
      lastFlushReport: { uploaded: 0, skippedConflict: 1, failed: 0 },
      flushNow: mockFlush,
      refreshPendingCount: mockRefresh,
    });

    render(<TechnicianOfflineSyncPanel />);

    expect(screen.getByTestId("offline-sync-conflict-notice")).toBeInTheDocument();
  });
});
