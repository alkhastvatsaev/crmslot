import { render, screen } from "@/test-utils/render";
import TechnicianDashboardDetailPanel from "@/features/interventions/components/TechnicianDashboardDetailPanel";
import { useInterventionLive } from "@/features/interventions/useInterventionLive";
import type { Intervention } from "@/features/interventions/types";

jest.mock("@/features/interventions/useInterventionLive", () => ({
  useInterventionLive: jest.fn(),
  useInterventionLiveSource: jest.fn(
    (_caseId: string | null, live?: Intervention | null) => live ?? null,
  ),
}));

jest.mock("@/context/TechnicianFinishJobContext", () => ({
  useTechnicianFinishJob: () => ({
    setFinishJobInterventionId: jest.fn(),
  }),
}));

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
  it("shows scroll region and description without finish overlay layer", () => {
    render(
      <TechnicianDashboardDetailPanel caseId="iv-detail-1" liveIntervention={iv()} />,
    );

    expect(screen.getByTestId("technician-dashboard-detail")).toBeInTheDocument();
    expect(screen.getByTestId("technician-detail-scroll")).toBeInTheDocument();
    expect(screen.getByTestId("technician-detail-description")).toHaveTextContent("Cylindre cassé");
    expect(screen.queryByTestId("technician-finish-job-layer")).not.toBeInTheDocument();
    expect(screen.getByTestId("mission-action-bar")).toBeInTheDocument();
  });

  it("shows assignment respond bar when technicianUid prop matches assigned mission", () => {
    render(
      <TechnicianDashboardDetailPanel
        caseId="iv-detail-1"
        technicianUid="demo-tech-local"
        liveIntervention={iv({ status: "assigned", assignedTechnicianUid: "demo-tech-local" })}
      />,
    );

    expect(screen.queryByTestId("technician-assignment-detail-banner")).not.toBeInTheDocument();
    expect(screen.getByTestId("technician-assignment-respond-bar")).toBeInTheDocument();
    expect(screen.getByTestId("technician-assignment-accept")).toBeInTheDocument();
    expect(screen.queryByTestId("mission-action-bar")).not.toBeInTheDocument();
  });
});
