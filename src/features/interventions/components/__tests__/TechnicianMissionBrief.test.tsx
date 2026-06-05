import { render, screen } from "@/test-utils/render";
import TechnicianMissionBrief from "@/features/interventions/components/TechnicianMissionBrief";

describe("TechnicianMissionBrief", () => {
  it("renders mission brief without description heading", () => {
    render(
      <TechnicianMissionBrief
        timeLabel="13:00"
        clientDisplayName="Alex Bach"
        address="Rue Test 1"
        descriptionText="Problème serrure"
      />,
    );

    expect(screen.getByTestId("technician-mission-brief")).toBeInTheDocument();
    expect(screen.getByTestId("technician-detail-client-name")).toHaveTextContent("Alex Bach");
    expect(screen.queryByText("Description")).not.toBeInTheDocument();
    expect(screen.getByTestId("technician-detail-description-text")).toHaveTextContent(
      "Problème serrure",
    );
  });

  it("renders problem text when awaiting assignment", () => {
    render(
      <TechnicianMissionBrief
        timeLabel="13:00"
        clientDisplayName="Alex Bach"
        address={null}
        descriptionText="Problème serrure"
        awaitingAssignment
      />,
    );

    expect(screen.queryByText("Description")).not.toBeInTheDocument();
    expect(screen.getByTestId("technician-detail-description-text")).toHaveTextContent(
      "Problème serrure",
    );
  });

  it("renders contact rail slot below description", () => {
    render(
      <TechnicianMissionBrief
        timeLabel="13:00"
        clientDisplayName="Alex Bach"
        address={null}
        descriptionText="Problème serrure"
        contactRail={<div data-testid="contact-slot">contacts</div>}
      />,
    );

    expect(screen.getByTestId("technician-mission-brief-contacts")).toBeInTheDocument();
    expect(screen.getByTestId("contact-slot")).toBeInTheDocument();
  });
});
