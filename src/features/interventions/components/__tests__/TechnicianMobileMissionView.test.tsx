import { fireEvent, render, screen } from "@/test-utils/render";
import TechnicianMobileMissionView from "@/features/interventions/components/TechnicianMobileMissionView";
import type { Intervention } from "@/features/interventions/types";

jest.mock("@/features/interventions/hooks/useTechnicianMissionActions", () => ({
  useTechnicianMissionActions: jest.fn(),
}));

const mockUseActions = jest.requireMock(
  "@/features/interventions/hooks/useTechnicianMissionActions"
).useTechnicianMissionActions as jest.Mock;

const baseIv: Intervention = {
  id: "iv-1",
  title: "Chaudière",
  address: "Rue Test 5",
  time: "14:00",
  status: "en_route",
  scheduledDate: "2026-05-16",
  scheduledTime: "14:00",
  clientFirstName: "Marie",
  clientLastName: "Dupont",
  clientPhone: "+32470123456",
  location: { lat: 50.8, lng: 4.35 },
};

describe("TechnicianMobileMissionView", () => {
  beforeEach(() => {
    mockUseActions.mockReturnValue({
      liveIv: baseIv,
      isUpdating: false,
      handleUpdateStatus: jest.fn(),
      onStartFinishJob: jest.fn(),
      technicianUid: "tech-1",
      awaitingAssignment: false,
      isInvoicedOrCancelled: false,
      isDoneAmendable: false,
      showActionBar: true,
    });
  });

  it("renders dark hero card with step track and floating CTA", () => {
    render(
      <TechnicianMobileMissionView caseId="iv-1" liveIntervention={baseIv} technicianUid="tech-1" />
    );

    expect(screen.getByTestId("technician-mobile-mission")).toHaveAttribute(
      "data-ui-version",
      "field-v2"
    );
    expect(screen.getByTestId("technician-mobile-step-track")).toBeInTheDocument();
    expect(screen.getByTestId("technician-mobile-mission-time")).toHaveTextContent("14:00");
    expect(screen.getByTestId("technician-mobile-mission-client")).toHaveTextContent(
      "Marie Dupont"
    );
    expect(screen.getByTestId("mission-action-primary-on-site")).toBeInTheDocument();
    expect(screen.getByTestId("technician-mobile-call")).toBeInTheDocument();
    expect(screen.getByTestId("technician-mobile-navigate")).toBeInTheDocument();
    expect(screen.queryByTestId("mission-contact-rail")).not.toBeInTheDocument();
  });

  it("shows empty state when no mission selected", () => {
    mockUseActions.mockReturnValue({
      liveIv: null,
      isUpdating: false,
      handleUpdateStatus: jest.fn(),
      onStartFinishJob: jest.fn(),
      technicianUid: "tech-1",
      awaitingAssignment: false,
      isInvoicedOrCancelled: false,
      isDoneAmendable: false,
      showActionBar: false,
    });

    render(<TechnicianMobileMissionView caseId={null} technicianUid="tech-1" />);
    expect(screen.getByTestId("technician-mobile-mission-empty")).toBeInTheDocument();
  });

  it("opens details sheet from info button", () => {
    const ivWithDesc = { ...baseIv, problem: "Fuite sous évier", title: "Chaudière" };
    mockUseActions.mockReturnValue({
      liveIv: ivWithDesc,
      isUpdating: false,
      handleUpdateStatus: jest.fn(),
      onStartFinishJob: jest.fn(),
      technicianUid: "tech-1",
      awaitingAssignment: false,
      isInvoicedOrCancelled: false,
      isDoneAmendable: false,
      showActionBar: true,
    });

    render(
      <TechnicianMobileMissionView
        caseId="iv-1"
        liveIntervention={ivWithDesc}
        technicianUid="tech-1"
      />
    );

    expect(screen.queryByTestId("technician-mobile-details-panel")).not.toBeInTheDocument();
    fireEvent.click(screen.getByTestId("technician-mobile-details-toggle"));
    expect(screen.getByTestId("technician-mobile-details-panel")).toHaveTextContent(
      "Fuite sous évier"
    );
  });
});
