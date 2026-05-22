import { fireEvent, waitFor } from "@testing-library/react";
import { render, screen } from "@/test-utils/render";
import type { Intervention } from "@/features/interventions/types";
import TechnicianAssignmentRespondBar from "@/features/interventions/components/TechnicianAssignmentRespondBar";
import {
  acceptTechnicianAssignment,
  declineTechnicianAssignment,
} from "@/features/interventions/respondToTechnicianAssignment";

jest.mock("@/features/interventions/respondToTechnicianAssignment", () => ({
  acceptTechnicianAssignment: jest.fn(),
  declineTechnicianAssignment: jest.fn(),
}));

const mockAccept = acceptTechnicianAssignment as jest.MockedFunction<
  typeof acceptTechnicianAssignment
>;
const mockDecline = declineTechnicianAssignment as jest.MockedFunction<
  typeof declineTechnicianAssignment
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

describe("TechnicianAssignmentRespondBar", () => {
  beforeEach(() => {
    mockAccept.mockClear();
    mockDecline.mockClear();
    mockAccept.mockResolvedValue(undefined);
    mockDecline.mockResolvedValue(undefined);
  });

  it("renders accept and decline actions", () => {
    render(
      <TechnicianAssignmentRespondBar iv={assignmentIv()} technicianUid="demo-tech-local" />,
    );

    expect(screen.getByTestId("technician-assignment-respond-bar")).toBeInTheDocument();
    expect(screen.getByTestId("technician-assignment-slide")).toBeInTheDocument();
    expect(screen.getByTestId("technician-assignment-slide-knob")).toBeInTheDocument();
    expect(screen.getByTestId("technician-assignment-accept")).toBeInTheDocument();
    expect(screen.getByTestId("technician-assignment-decline")).toBeInTheDocument();
  });

  it("accept calls acceptTechnicianAssignment", async () => {
    const iv = assignmentIv();
    render(<TechnicianAssignmentRespondBar iv={iv} technicianUid="demo-tech-local" />);

    fireEvent.click(screen.getByTestId("technician-assignment-accept"));

    await waitFor(() => expect(mockAccept).toHaveBeenCalledWith(iv));
  });

  it("decline calls declineTechnicianAssignment with technician uid", async () => {
    const iv = assignmentIv();
    render(<TechnicianAssignmentRespondBar iv={iv} technicianUid="demo-tech-local" />);

    fireEvent.click(screen.getByTestId("technician-assignment-decline"));

    await waitFor(() =>
      expect(mockDecline).toHaveBeenCalledWith(iv, "demo-tech-local"),
    );
  });
});
