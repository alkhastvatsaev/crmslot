import { render, screen } from "@/test-utils/render";
import type { Intervention } from "@/features/interventions/types";
import TechnicianAssignmentOfferCard from "@/features/interventions/components/TechnicianAssignmentOfferCard";

function assignmentIv(partial: Partial<Intervention> = {}): Intervention {
  return {
    id: "iv-offer-1",
    title: "Chaudière",
    address: "Rue test 1",
    time: "10:00",
    status: "assigned",
    assignedTechnicianUid: "demo-tech-local",
    clientFirstName: "Jean",
    clientLastName: "Martin",
    location: { lat: 50.8, lng: 4.35 },
    scheduledDate: "2026-05-16",
    scheduledTime: "11:00",
    ...partial,
  };
}

describe("TechnicianAssignmentOfferCard", () => {
  it("renders list entry without action buttons", () => {
    render(
      <TechnicianAssignmentOfferCard
        iv={assignmentIv()}
        index={0}
        isSelected={false}
        onSelect={jest.fn()}
      />,
    );

    expect(screen.getByTestId("technician-assignment-offer-iv-offer-1")).toBeInTheDocument();
    expect(screen.queryByTestId("technician-assignment-accept")).not.toBeInTheDocument();
    expect(screen.queryByTestId("technician-assignment-decline")).not.toBeInTheDocument();
  });
});
