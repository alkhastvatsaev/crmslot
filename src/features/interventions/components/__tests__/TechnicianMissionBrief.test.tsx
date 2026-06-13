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
      />
    );

    expect(screen.getByTestId("technician-mission-brief")).toBeInTheDocument();
    expect(screen.getByTestId("technician-detail-client-name")).toHaveTextContent("Alex Bach");
    expect(screen.queryByText("Description")).not.toBeInTheDocument();
    expect(screen.getByTestId("technician-detail-description-text")).toHaveTextContent(
      "Problème serrure"
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
      />
    );

    expect(screen.queryByText("Description")).not.toBeInTheDocument();
    expect(screen.getByTestId("technician-detail-description-text")).toHaveTextContent(
      "Problème serrure"
    );
  });

  it("links address to Google Maps when href is provided", () => {
    render(
      <TechnicianMissionBrief
        timeLabel="13:00"
        clientDisplayName="Alex Bach"
        address="Rue Test 1, Bruxelles"
        addressMapsHref="https://www.google.com/maps/dir/?api=1&destination=Rue%20Test%201"
        descriptionText="Problème serrure"
      />
    );

    const link = screen.getByTestId("technician-detail-address-link");
    expect(link).toHaveAttribute(
      "href",
      "https://www.google.com/maps/dir/?api=1&destination=Rue%20Test%201"
    );
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveTextContent("Rue Test 1, Bruxelles");
  });

  it("renders contact rail slot below description", () => {
    render(
      <TechnicianMissionBrief
        timeLabel="13:00"
        clientDisplayName="Alex Bach"
        address={null}
        descriptionText="Problème serrure"
        contactRail={<div data-testid="contact-slot">contacts</div>}
      />
    );

    expect(screen.getByTestId("technician-mission-brief-contacts")).toBeInTheDocument();
    expect(screen.getByTestId("contact-slot")).toBeInTheDocument();
  });
});
