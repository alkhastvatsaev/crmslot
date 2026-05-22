import { fireEvent, screen, waitFor } from "@testing-library/react";
import { render } from "@/test-utils/render";
import CompanyStockOrdersTrackPanel from "@/features/featureHub/components/CompanyStockOrdersTrackPanel";
import type { MaterialOrderDoc } from "@/features/materials/materialOrderFirestore";
import type { SupplierOrder } from "@/features/suppliers/types";

jest.mock("sonner", () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}));

const pendingOrder: MaterialOrderDoc = {
  id: "demo-mo-1",
  companyId: "co-1",
  interventionId: "INT-1",
  technicianUid: "tech-1",
  partsRequested: [{ description: "Cylindre 80 mm", quantity: 1 }],
  urgency: "normal",
  status: "pending",
  createdAt: "2026-05-21T12:00:00.000Z",
  updatedAt: "2026-05-21T12:00:00.000Z",
};

const supplierOrder: SupplierOrder = {
  id: "so-1",
  companyId: "co-1",
  supplierId: "lecot",
  supplierName: "Lecot",
  status: "sent",
  lines: [{ sku: "A", label: "Poignée inox", quantity: 2, unitPriceCents: 1200 }],
  totalCents: 2400,
  createdAt: "2026-05-20T10:00:00.000Z",
  updatedAt: "2026-05-20T10:00:00.000Z",
  isDemo: true,
};

describe("CompanyStockOrdersTrackPanel", () => {
  it("shows Suivi commandes title and pending field order", () => {
    render(
      <CompanyStockOrdersTrackPanel
        orders={[pendingOrder]}
        supplierOrders={[]}
        loading={false}
        onDismissDemoOrder={jest.fn()}
      />,
    );
    expect(screen.getByTestId("company-stock-orders-track")).toBeInTheDocument();
    expect(screen.getByText("Suivi commandes")).toBeInTheDocument();
    expect(screen.getByTestId("company-stock-field-order-demo-mo-1")).toBeInTheDocument();
    expect(screen.getByText("Client")).toBeInTheDocument();
    expect(screen.getByTestId("company-stock-track-supplier-empty")).toBeInTheDocument();
  });

  it("shows open supplier orders", () => {
    render(
      <CompanyStockOrdersTrackPanel
        orders={[]}
        supplierOrders={[supplierOrder]}
        loading={false}
      />,
    );
    expect(screen.getByTestId("company-stock-supplier-order-so-1")).toBeInTheDocument();
    expect(screen.getByTestId("company-stock-track-field-empty")).toBeInTheDocument();
  });

  it("approving demo order calls onDismissDemoOrder", async () => {
    const onDismissDemoOrder = jest.fn();
    render(
      <CompanyStockOrdersTrackPanel
        orders={[pendingOrder]}
        supplierOrders={[]}
        loading={false}
        onDismissDemoOrder={onDismissDemoOrder}
      />,
    );
    fireEvent.click(screen.getByTestId("company-stock-approve-order-demo-mo-1"));
    await waitFor(() => {
      expect(onDismissDemoOrder).toHaveBeenCalledWith("demo-mo-1");
    });
  });
});
