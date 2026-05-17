import { fireEvent, waitFor } from "@testing-library/react";
import { render, screen } from "@/test-utils/render";
import type { Intervention } from "@/features/interventions/types";
import TechnicianAssignmentOfferCard from "@/features/interventions/components/TechnicianAssignmentOfferCard";
import { transitionInterventionStatus } from "@/features/interventions/workflow/transitionInterventionStatus";

jest.mock("@/features/interventions/workflow/transitionInterventionStatus", () => ({
  transitionInterventionStatus: jest.fn(),
}));

jest.mock("@/features/interventions/workflow/workflowActor", () => ({
  requireAuthTransitionActor: jest.fn(() => ({ uid: "demo-tech-local", role: "technician" })),
}));

const mockTransition = transitionInterventionStatus as jest.MockedFunction<
  typeof transitionInterventionStatus
>;

jest.mock("sonner", () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

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
  beforeEach(() => {
    mockTransition.mockClear();
    mockTransition.mockResolvedValue({ id: "evt-1" } as any);
  });

  it("renders offer actions for assigned mission", () => {
    render(
      <TechnicianAssignmentOfferCard
        iv={assignmentIv()}
        index={0}
        isSelected={false}
        technicianUid="demo-tech-local"
        onSelect={jest.fn()}
      />,
    );

    expect(screen.getByTestId("technician-assignment-offer-iv-offer-1")).toBeInTheDocument();
    expect(screen.getByTestId("technician-assignment-accept")).toBeInTheDocument();
    expect(screen.getByTestId("technician-assignment-decline")).toBeInTheDocument();
  });

  it("accept transitions to en_route via workflow", async () => {
    render(
      <TechnicianAssignmentOfferCard
        iv={assignmentIv()}
        index={0}
        isSelected={false}
        technicianUid="demo-tech-local"
        onSelect={jest.fn()}
      />,
    );

    fireEvent.click(screen.getByTestId("technician-assignment-accept"));

    await waitFor(() => expect(mockTransition).toHaveBeenCalledTimes(1));
    expect(mockTransition.mock.calls[0]?.[0]).toMatchObject({
      interventionId: "iv-offer-1",
      toStatus: "en_route",
    });
    const extra = mockTransition.mock.calls[0]?.[0].extraPatch as Record<string, unknown>;
    expect(typeof extra.technicianAcceptedAt).toBe("string");
  });

  it("decline transitions to pending with decline patch", async () => {
    render(
      <TechnicianAssignmentOfferCard
        iv={assignmentIv()}
        index={0}
        isSelected={false}
        technicianUid="demo-tech-local"
        onSelect={jest.fn()}
      />,
    );

    fireEvent.click(screen.getByTestId("technician-assignment-decline"));

    await waitFor(() => expect(mockTransition).toHaveBeenCalledTimes(1));
    expect(mockTransition.mock.calls[0]?.[0]).toMatchObject({
      interventionId: "iv-offer-1",
      toStatus: "pending",
    });
    const extra = mockTransition.mock.calls[0]?.[0].extraPatch as Record<string, unknown>;
    expect(extra.assignedTechnicianUid).toBeNull();
    expect(extra.technicianDeclinedByUid).toBe("demo-tech-local");
    expect(typeof extra.technicianDeclinedAt).toBe("string");
  });
});
