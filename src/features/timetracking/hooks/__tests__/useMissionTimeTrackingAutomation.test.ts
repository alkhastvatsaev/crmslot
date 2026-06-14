import { renderHook, waitFor } from "@testing-library/react";
import { useMissionTimeTrackingAutomation } from "@/features/timetracking/hooks/useMissionTimeTrackingAutomation";
import { logCrmTimeEntryRecorded } from "@/features/timetracking/logCrmTimeEntryRecorded";
import {
  startTimeEntry,
  stopTimeEntry,
  subscribeTimeEntriesByIntervention,
} from "@/features/timetracking/timetrackingFirestore";
import type { Intervention } from "@/features/interventions/types";

jest.mock("@/context/CompanyWorkspaceContext", () => ({
  useCompanyWorkspaceOptional: () => ({
    activeCompanyId: "co-1",
    firebaseUid: "tech-1",
  }),
}));

jest.mock("@/core/config/firebase", () => ({
  firestore: {},
}));

jest.mock("@/features/timetracking/logCrmTimeEntryRecorded", () => ({
  logCrmTimeEntryRecorded: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("@/features/timetracking/timetrackingFirestore", () => ({
  subscribeTimeEntriesByIntervention: jest.fn(),
  startTimeEntry: jest.fn().mockResolvedValue("entry-1"),
  stopTimeEntry: jest.fn().mockResolvedValue(undefined),
}));

const mockSubscribe = subscribeTimeEntriesByIntervention as jest.MockedFunction<
  typeof subscribeTimeEntriesByIntervention
>;
const mockStart = startTimeEntry as jest.MockedFunction<typeof startTimeEntry>;
const mockStop = stopTimeEntry as jest.MockedFunction<typeof stopTimeEntry>;
const mockLogCrm = logCrmTimeEntryRecorded as jest.MockedFunction<typeof logCrmTimeEntryRecorded>;

function iv(status: Intervention["status"]): Intervention {
  return {
    id: "iv-1",
    title: "Test",
    address: "Rue 1",
    time: "10:00",
    status,
    companyId: "co-1",
    location: { lat: 50.846, lng: 4.352 },
  };
}

describe("useMissionTimeTrackingAutomation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSubscribe.mockImplementation((_db, _companyId, _ivId, onData) => {
      onData([]);
      return () => {};
    });
  });

  it("starts travel silently when mission is en_route", async () => {
    renderHook(() =>
      useMissionTimeTrackingAutomation({
        enabled: true,
        intervention: iv("en_route"),
        technicianUid: "tech-1",
      })
    );

    await waitFor(() => {
      expect(mockStart).toHaveBeenCalledWith({}, "co-1", "tech-1", "travel", "iv-1");
    });
  });

  it("stops travel and starts on_site when status becomes in_progress", async () => {
    const travelEntry = {
      id: "entry-travel",
      companyId: "co-1",
      technicianUid: "tech-1",
      interventionId: "iv-1",
      type: "travel" as const,
      startedAt: new Date(Date.now() - 8 * 60_000).toISOString(),
      endedAt: null,
      durationMinutes: null,
      notes: null,
    };

    mockSubscribe.mockImplementation((_db, _companyId, _ivId, onData) => {
      onData([travelEntry]);
      return () => {};
    });

    const { rerender } = renderHook(
      ({ status }: { status: Intervention["status"] }) =>
        useMissionTimeTrackingAutomation({
          enabled: true,
          intervention: iv(status),
          technicianUid: "tech-1",
        }),
      { initialProps: { status: "en_route" as Intervention["status"] } }
    );

    rerender({ status: "in_progress" });

    await waitFor(() => {
      expect(mockStop).toHaveBeenCalled();
      expect(mockLogCrm).toHaveBeenCalledWith(
        expect.objectContaining({ entryType: "travel", actorUid: "tech-1" })
      );
      expect(mockStart).toHaveBeenCalledWith({}, "co-1", "tech-1", "on_site", "iv-1");
    });
  });

  it("flushActiveTimeEntry logs on_site before finish flow", async () => {
    const onSiteEntry = {
      id: "entry-site",
      companyId: "co-1",
      technicianUid: "tech-1",
      interventionId: "iv-1",
      type: "on_site" as const,
      startedAt: new Date(Date.now() - 12 * 60_000).toISOString(),
      endedAt: null,
      durationMinutes: null,
      notes: null,
    };

    mockSubscribe.mockImplementation((_db, _companyId, _ivId, onData) => {
      onData([onSiteEntry]);
      return () => {};
    });

    const { result } = renderHook(() =>
      useMissionTimeTrackingAutomation({
        enabled: true,
        intervention: iv("in_progress"),
        technicianUid: "tech-1",
      })
    );

    await waitFor(() => {
      expect(mockStart).not.toHaveBeenCalled();
    });

    await result.current.flushActiveTimeEntry();

    await waitFor(() => {
      expect(mockStop).toHaveBeenCalled();
      expect(mockLogCrm).toHaveBeenCalledWith(
        expect.objectContaining({ entryType: "on_site", actorUid: "tech-1" })
      );
    });
  });
});
