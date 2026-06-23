"use client";

import { screen } from "@testing-library/react";
import { render } from "@/test-utils/render";
import CompanyStockCenterPanel from "@/features/featureHub/components/CompanyStockCenterPanel";
import { CompanyStockIntentProvider } from "@/context/CompanyStockIntentContext";
import type { StockItem } from "@/features/materials";

jest.mock("@/core/api/fetchWithAuth", () => ({
  fetchWithAuth: jest.fn(async () => ({
    ok: true,
    json: async () => ({ images: {} }),
  })),
}));

const items: StockItem[] = [
  {
    id: "s1",
    companyId: "co",
    reference: "REF-A",
    description: "Gâche électrique",
    quantity: 2,
    alertThreshold: 5,
    unit: "pcs",
    updatedAt: "2026-05-01",
  },
];

function renderPanel(overrideItems: StockItem[] = items) {
  return render(
    <CompanyStockIntentProvider>
      <CompanyStockCenterPanel items={overrideItems} orders={[]} category="all" loading={false} />
    </CompanyStockIntentProvider>
  );
}

describe("CompanyStockCenterPanel", () => {
  it("renders stock list only", () => {
    renderPanel();
    expect(screen.getByTestId("company-stock-center")).toBeInTheDocument();
    expect(screen.getByTestId("company-stock-lecot-catalog")).toBeInTheDocument();
    expect(screen.queryByTestId("company-stock-search")).not.toBeInTheDocument();
    expect(screen.getByTestId("company-stock-list")).toBeInTheDocument();
    expect(screen.queryByTestId("company-stock-pulse")).not.toBeInTheDocument();
    expect(screen.queryByTestId("company-stock-filter-bar")).not.toBeInTheDocument();
    expect(screen.queryByTestId("company-stock-autopilot-primary")).not.toBeInTheDocument();
    expect(screen.queryByTestId("company-stock-add")).not.toBeInTheDocument();
  });

  it("shows preview banner when catalog is preview-only", () => {
    render(
      <CompanyStockIntentProvider>
        <CompanyStockCenterPanel
          items={items}
          orders={[]}
          category="all"
          loading={false}
          isPreviewCatalog
        />
      </CompanyStockIntentProvider>
    );
    expect(screen.getByTestId("company-stock-preview-banner")).toBeInTheDocument();
  });

  it("shows stock card for item in grid layout", () => {
    renderPanel();
    const list = screen.getByTestId("company-stock-list");
    expect(list).toHaveAttribute("data-layout", "grid-3");
    expect(list.className).toMatch(/grid/);
    expect(screen.getByTestId("company-stock-card-s1")).toBeInTheDocument();
    expect(screen.getByTestId("company-stock-card-s1")).toHaveAttribute("data-health", "low");
  });
});
