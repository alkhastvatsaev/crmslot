import { fireEvent, waitFor } from "@testing-library/react";
import { render, screen } from "@/test-utils/render";
import type { Intervention } from "@/features/interventions/types";
import TechnicianAssignmentRespondBar from "@/features/interventions/components/TechnicianAssignmentRespondBar";
import {
  acceptTechnicianAssignment,
  declineTechnicianAssignment,
} from "@/features/interventions/respondToTechnicianAssignment";
import { patchTechnicianAssignmentInCache } from "@/features/interventions/patchTechnicianAssignmentInCache";

jest.mock("@/features/interventions/respondToTechnicianAssignment", () => ({
  acceptTechnicianAssignment: jest.fn(),
  declineTechnicianAssignment: jest.fn(),
}));

jest.mock("@/features/interventions/patchTechnicianAssignmentInCache", () => ({
  patchTechnicianAssignmentInCache: jest.fn(),
}));

const mockAccept = acceptTechnicianAssignment as jest.MockedFunction<
  typeof acceptTechnicianAssignment
>;
const mockDecline = declineTechnicianAssignment as jest.MockedFunction<
  typeof declineTechnicianAssignment
>;
const mockPatchCache = patchTechnicianAssignmentInCache as jest.MockedFunction<
  typeof patchTechnicianAssignmentInCache
>;

jest.mock("sonner", () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

const mockQueryClient = { setQueryData: jest.fn() };
jest.mock("@tanstack/react-query", () => ({
  ...jest.requireActual("@tanstack/react-query"),
  useQueryClient: () => mockQueryClient,
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
    mockPatchCache.mockClear();
    mockAccept.mockResolvedValue(undefined);
    mockDecline.mockResolvedValue(undefined);
  });

  it("renders visible accept and decline buttons", () => {
    render(<TechnicianAssignmentRespondBar iv={assignmentIv()} technicianUid="demo-tech-local" />);

    expect(screen.getByTestId("technician-assignment-respond-bar")).toBeInTheDocument();
    expect(screen.getByTestId("technician-assignment-accept")).toBeVisible();
    expect(screen.getByTestId("technician-assignment-decline")).toBeVisible();
    expect(screen.queryByTestId("technician-assignment-slide")).not.toBeInTheDocument();
  });

  it("accept patches cache optimistically then calls API and onAccepted", async () => {
    const iv = assignmentIv();
    const onAccepted = jest.fn();
    render(
      <TechnicianAssignmentRespondBar
        iv={iv}
        technicianUid="demo-tech-local"
        onAccepted={onAccepted}
      />
    );

    fireEvent.click(screen.getByTestId("technician-assignment-accept"));

    await waitFor(() => expect(mockAccept).toHaveBeenCalledWith(iv));
    expect(mockPatchCache).toHaveBeenCalledWith(
      mockQueryClient,
      "demo-tech-local",
      iv.id,
      expect.objectContaining({ status: "en_route", technicianAcceptedAt: expect.any(String) })
    );
    expect(onAccepted).toHaveBeenCalledWith(
      expect.objectContaining({ id: iv.id, status: "en_route" })
    );
  });

  it("decline patches cache, calls API and onDeclined", async () => {
    const iv = assignmentIv();
    const onDeclined = jest.fn();
    render(
      <TechnicianAssignmentRespondBar
        iv={iv}
        technicianUid="demo-tech-local"
        onDeclined={onDeclined}
      />
    );

    fireEvent.click(screen.getByTestId("technician-assignment-decline"));

    await waitFor(() => expect(mockDecline).toHaveBeenCalledWith(iv, "demo-tech-local"));
    expect(mockPatchCache).toHaveBeenCalledWith(
      mockQueryClient,
      "demo-tech-local",
      iv.id,
      expect.objectContaining({ status: "pending" })
    );
    expect(onDeclined).toHaveBeenCalled();
  });
});
