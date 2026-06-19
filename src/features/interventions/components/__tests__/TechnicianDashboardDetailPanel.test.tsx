import { render, screen } from "@/test-utils/render";
import TechnicianDashboardDetailPanel from "@/features/interventions/components/TechnicianDashboardDetailPanel";
import { useInterventionLive } from "@/features/interventions/useInterventionLive";
import type { Intervention } from "@/features/interventions/types";

jest.mock("@/features/interventions/useInterventionLive", () => ({
  useInterventionLive: jest.fn(),
  useInterventionLiveSource: jest.fn(
    (_caseId: string | null, live?: Intervention | null) => live ?? null
  ),
}));

jest.mock("@/features/interventions/workflow/transitionInterventionFromTechnician", () => ({
  transitionInterventionFromTechnician: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("@/features/interventions/respondToTechnicianAssignment", () => ({
  acceptTechnicianAssignment: jest.fn().mockResolvedValue(undefined),
  declineTechnicianAssignment: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("@/context/TechnicianFinishJobContext", () => ({
  useTechnicianFinishJob: () => ({
    setFinishJobInterventionId: jest.fn(),
    finishWizardStep: null,
    setFinishWizardStep: jest.fn(),
    finishJobInterventionId: null,
    finishJobEntryStep: null,
    startFinishJob: jest.fn(),
  }),
}));

import { fireEvent, waitFor } from "@testing-library/react";
import { transitionInterventionFromTechnician } from "@/features/interventions/workflow/transitionInterventionFromTechnician";
import { acceptTechnicianAssignment } from "@/features/interventions/respondToTechnicianAssignment";

const mockTransition = transitionInterventionFromTechnician as jest.MockedFunction<
  typeof transitionInterventionFromTechnician
>;
const mockAccept = acceptTechnicianAssignment as jest.MockedFunction<
  typeof acceptTechnicianAssignment
>;

jest.mock("@/core/config/firebase", () => ({
  auth: { currentUser: { uid: "anonymous-other-uid" } },
  firestore: null,
  isConfigured: true,
}));

function iv(partial: Partial<Intervention> = {}): Intervention {
  return {
    id: "iv-detail-1",
    title: "Porte bloquée",
    address: "Rue Test 12, Bruxelles",
    time: "10:00",
    status: "in_progress",
    assignedTechnicianUid: "demo-tech-local",
    technicianAcceptedAt: "2026-05-16T08:00:00.000Z",
    problem: "Cylindre cassé",
    location: { lat: 50.8, lng: 4.35 },
    clientFirstName: "Jean",
    clientLastName: "Dupont",
    ...partial,
  };
}

describe("TechnicianDashboardDetailPanel", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2026-05-16T08:00:00"));
    mockTransition.mockClear();
    mockAccept.mockClear();
  });

  afterEach(() => {
    jest.useRealTimers();
  });
  it("shows scroll region and description without finish overlay layer", () => {
    render(<TechnicianDashboardDetailPanel caseId="iv-detail-1" liveIntervention={iv()} />);

    expect(screen.getByTestId("technician-dashboard-detail")).toBeInTheDocument();
    const body = screen.getByTestId("technician-detail-scroll");
    expect(body).toBeInTheDocument();
    expect(body).toHaveClass("overflow-hidden");
    expect(screen.getByTestId("technician-detail-description-text")).toHaveTextContent(
      "Cylindre cassé"
    );
    expect(screen.getByTestId("technician-detail-client-name")).toBeInTheDocument();
    expect(screen.queryByTestId("technician-finish-job-layer")).not.toBeInTheDocument();
    expect(screen.getByTestId("mission-action-bar")).toBeInTheDocument();
  });

  it("shows assignment respond bar when technicianUid prop matches assigned mission", () => {
    render(
      <TechnicianDashboardDetailPanel
        caseId="iv-detail-1"
        technicianUid="demo-tech-local"
        liveIntervention={iv({
          status: "assigned",
          assignedTechnicianUid: "demo-tech-local",
          scheduledDate: "2026-05-16",
          scheduledTime: "08:00",
        })}
      />
    );

    expect(screen.queryByTestId("technician-assignment-detail-banner")).not.toBeInTheDocument();
    expect(screen.getByTestId("technician-assignment-respond-bar")).toBeInTheDocument();
    expect(screen.getByTestId("technician-assignment-accept")).toBeInTheDocument();
    expect(screen.queryByTestId("mission-action-bar")).not.toBeInTheDocument();
    expect(screen.getByTestId("technician-detail-description-text")).toHaveTextContent(
      "Cylindre cassé"
    );
    expect(screen.getByTestId("technician-detail-client-name")).toHaveClass(
      "technician-detail-client-name"
    );
    expect(screen.queryByText("Description")).not.toBeInTheDocument();
  });

  it("shows IVANA rejection banner when report was sent back", () => {
    render(
      <TechnicianDashboardDetailPanel
        caseId="iv-detail-1"
        technicianUid="demo-tech-local"
        liveIntervention={iv({
          reportRejectionReason: "Photos manquantes",
          reportRejectedAt: "2026-05-16T12:00:00.000Z",
        })}
      />
    );

    expect(screen.getByTestId("technician-report-rejected-banner")).toHaveTextContent(
      "Photos manquantes"
    );
    expect(screen.getByTestId("mission-action-bar")).toBeInTheDocument();
  });

  it("shows edit report CTA for done mission amendable by technician", () => {
    render(
      <TechnicianDashboardDetailPanel
        caseId="iv-detail-1"
        technicianUid="demo-tech-local"
        liveIntervention={iv({
          status: "done",
          assignedTechnicianUid: "demo-tech-local",
          completedAt: "2026-05-16T10:00:00.000Z",
        })}
      />
    );

    expect(screen.getByTestId("technician-detail-done-badge")).toBeInTheDocument();
    expect(screen.getByTestId("technician-edit-completion-report")).toBeInTheDocument();
    expect(screen.queryByTestId("mission-action-bar")).not.toBeInTheDocument();
  });

  it("shows early start overlay before scheduled slot on en_route mission", () => {
    render(
      <TechnicianDashboardDetailPanel
        caseId="iv-detail-1"
        technicianUid="demo-tech-local"
        liveIntervention={iv({
          status: "en_route",
          scheduledDate: "2026-05-16",
          scheduledTime: "09:00",
        })}
      />
    );

    expect(screen.getByTestId("technician-early-start-prompt")).toBeInTheDocument();
    expect(screen.queryByTestId("mission-action-bar")).not.toBeInTheDocument();
  });

  it("starts en_route mission early from overlay confirm", async () => {
    render(
      <TechnicianDashboardDetailPanel
        caseId="iv-detail-1"
        technicianUid="demo-tech-local"
        liveIntervention={iv({
          status: "en_route",
          scheduledDate: "2026-05-16",
          scheduledTime: "09:00",
        })}
      />
    );

    fireEvent.click(screen.getByTestId("technician-early-start-confirm"));

    await waitFor(() => {
      expect(mockTransition).toHaveBeenCalledWith(
        expect.objectContaining({ toStatus: "in_progress" })
      );
    });
  });

  it("hides early start overlay after dismiss and restores action bar", () => {
    render(
      <TechnicianDashboardDetailPanel
        caseId="iv-detail-1"
        technicianUid="demo-tech-local"
        liveIntervention={iv({
          status: "en_route",
          scheduledDate: "2026-05-16",
          scheduledTime: "09:00",
        })}
      />
    );

    fireEvent.click(screen.getByTestId("technician-early-start-dismiss"));
    expect(screen.queryByTestId("technician-early-start-prompt")).not.toBeInTheDocument();
    expect(screen.getByTestId("mission-action-bar")).toBeInTheDocument();
  });
});
