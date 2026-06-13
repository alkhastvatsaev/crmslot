import { render, screen, waitFor, fireEvent } from "@/test-utils/render";
import TimeTrackingWidget from "@/features/timetracking/components/TimeTrackingWidget";
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

function iv(partial: Partial<Intervention> = {}): Intervention {
  return {
    id: "iv-1",
    title: "Test",
    address: "Rue 1",
    time: "10:00",
    status: "en_route",
    companyId: "co-1",
    location: { lat: 50.846, lng: 4.352 },
    ...partial,
  };
}

describe("TimeTrackingWidget", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSubscribe.mockImplementation((_db, _companyId, _ivId, onData) => {
      onData([]);
      return () => {};
    });
  });

  it("auto-starts travel on en_route when automateMissionFlow is enabled", async () => {
    const onStatusTransition = jest.fn().mockResolvedValue(undefined);

    render(
      <TimeTrackingWidget
        interventionId="iv-1"
        intervention={iv({ status: "en_route" })}
        automateMissionFlow
        onStatusTransition={onStatusTransition}
      />
    );

    await waitFor(() => {
      expect(mockStart).toHaveBeenCalledWith({}, "co-1", "tech-1", "travel", "iv-1");
    });
    expect(onStatusTransition).not.toHaveBeenCalled();
  });

  it("logs CRM and opens finish flow after on_site stop", async () => {
    const onAfterOnSiteStop = jest.fn();
    const activeEntry = {
      id: "entry-active",
      companyId: "co-1",
      technicianUid: "tech-1",
      interventionId: "iv-1",
      type: "on_site" as const,
      startedAt: new Date(Date.now() - 5 * 60_000).toISOString(),
      endedAt: null,
      durationMinutes: null,
      notes: null,
    };

    mockSubscribe.mockImplementation((_db, _companyId, _ivId, onData) => {
      onData([activeEntry]);
      return () => {};
    });

    render(
      <TimeTrackingWidget
        interventionId="iv-1"
        intervention={iv({ status: "in_progress" })}
        automateMissionFlow
        onAfterOnSiteStop={onAfterOnSiteStop}
      />
    );

    fireEvent.click(screen.getByTestId("time-stop"));

    await waitFor(() => {
      expect(mockStop).toHaveBeenCalled();
      expect(mockLogCrm).toHaveBeenCalledWith(
        expect.objectContaining({
          entryType: "on_site",
          actorUid: "tech-1",
        })
      );
      expect(onAfterOnSiteStop).toHaveBeenCalled();
    });
  });

  it("transitions to in_progress and starts on_site after travel stop", async () => {
    const onStatusTransition = jest.fn().mockResolvedValue(undefined);
    const activeEntry = {
      id: "entry-travel",
      companyId: "co-1",
      technicianUid: "tech-1",
      interventionId: "iv-1",
      type: "travel" as const,
      startedAt: new Date(Date.now() - 10 * 60_000).toISOString(),
      endedAt: null,
      durationMinutes: null,
      notes: null,
    };

    mockSubscribe.mockImplementation((_db, _companyId, _ivId, onData) => {
      onData([activeEntry]);
      return () => {};
    });

    render(
      <TimeTrackingWidget
        interventionId="iv-1"
        intervention={iv({ status: "en_route" })}
        automateMissionFlow
        onStatusTransition={onStatusTransition}
      />
    );

    fireEvent.click(screen.getByTestId("time-stop"));

    await waitFor(() => {
      expect(mockStop).toHaveBeenCalled();
      expect(onStatusTransition).toHaveBeenCalledWith("in_progress");
      expect(mockStart).toHaveBeenCalledWith({}, "co-1", "tech-1", "on_site", "iv-1");
    });
  });
});
