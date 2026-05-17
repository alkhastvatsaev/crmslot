import { fireEvent, screen, waitFor } from "@testing-library/react";
import { render } from "@/test-utils/render";
import { mockState } from "@/test-utils/mockState";

jest.mock("@/core/config/firebase", () => ({
  firestore: {},
  auth: { currentUser: { uid: "mock-user-123" } },
}));

import InterventionMaterialOrdersPanel from "@/features/materials/components/InterventionMaterialOrdersPanel";
import { createMaterialOrder } from "@/features/materials/createMaterialOrder";
import { updateMaterialOrderStatus } from "@/features/materials/materialOrderFirestore";
import { useMaterialOrders } from "@/features/materials/useMaterialOrders";

jest.mock("@/features/materials/useMaterialOrders");
jest.mock("@/features/materials/createMaterialOrder");
jest.mock("@/features/materials/materialOrderFirestore", () => ({
  updateMaterialOrderStatus: jest.fn(),
}));

const mockUseMaterialOrders = useMaterialOrders as jest.MockedFunction<typeof useMaterialOrders>;
const mockCreateMaterialOrder = createMaterialOrder as jest.MockedFunction<typeof createMaterialOrder>;
const mockUpdateStatus = updateMaterialOrderStatus as jest.MockedFunction<typeof updateMaterialOrderStatus>;

const intervention = {
  id: "iv-mat-1",
  status: "in_progress" as const,
  companyId: "co-1",
  assignedTechnicianUid: "tech-1",
  createdByUid: "client-1",
};

describe("InterventionMaterialOrdersPanel", () => {
  beforeEach(() => {
    mockState.reset();
    mockUseMaterialOrders.mockReturnValue({ orders: [], loading: false });
    mockCreateMaterialOrder.mockResolvedValue("order-new");
    mockUpdateStatus.mockResolvedValue(undefined);
  });

  it("renders collapsed panel with toggle", () => {
    render(
      <InterventionMaterialOrdersPanel intervention={intervention} technicianUid="tech-1" />,
    );
    expect(screen.getByTestId("intervention-material-orders-panel")).toBeInTheDocument();
    expect(screen.queryByTestId("material-orders-list")).not.toBeInTheDocument();
  });

  it("shows empty state when expanded", () => {
    render(
      <InterventionMaterialOrdersPanel intervention={intervention} technicianUid="tech-1" />,
    );
    fireEvent.click(screen.getByTestId("material-orders-toggle"));
    expect(screen.getByTestId("material-orders-list")).toBeInTheDocument();
  });

  it("lists orders and allows dispatch status update", async () => {
    mockUseMaterialOrders.mockReturnValue({
      orders: [
        {
          id: "o1",
          interventionId: "iv-mat-1",
          technicianUid: "tech-1",
          partsRequested: [{ description: "Cylindre", quantity: 1 }],
          urgency: "normal",
          status: "pending",
          createdAt: "2026-05-17T10:00:00.000Z",
          updatedAt: "2026-05-17T10:00:00.000Z",
        },
      ],
      loading: false,
    });

    render(
      <InterventionMaterialOrdersPanel
        intervention={intervention}
        technicianUid="tech-1"
        allowStatusUpdate
        allowCreate={false}
      />,
    );
    fireEvent.click(screen.getByTestId("material-orders-toggle"));

    expect(screen.getByTestId("material-order-o1")).toBeInTheDocument();
    fireEvent.click(screen.getByTestId("material-order-status-o1-ordered"));

    await waitFor(() => {
      expect(mockUpdateStatus).toHaveBeenCalledWith(expect.anything(), "o1", "ordered");
    });
  });

  it("opens form and submits new order", async () => {
    render(
      <InterventionMaterialOrdersPanel intervention={intervention} technicianUid="tech-1" />,
    );
    fireEvent.click(screen.getByTestId("material-orders-toggle"));
    fireEvent.click(screen.getByTestId("material-order-new"));

    fireEvent.change(screen.getByTestId("material-order-description-0"), {
      target: { value: "Cylindre européen" },
    });
    fireEvent.click(screen.getByTestId("material-order-submit"));

    await waitFor(() => {
      expect(mockCreateMaterialOrder).toHaveBeenCalledWith(
        expect.objectContaining({
          intervention,
          technicianUid: "tech-1",
          partsRequested: [{ description: "Cylindre européen", quantity: 1, reference: "" }],
        }),
      );
    });
  });
});
