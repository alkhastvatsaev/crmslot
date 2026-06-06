import { fireEvent, screen } from "@testing-library/react";
import { render } from "@/test-utils/render";
import CompanyStockItemList from "@/features/featureHub/components/CompanyStockItemList";
import type { StockItem } from "@/features/materials/stockFirestore";

const item: StockItem = {
  id: "tile-1",
  companyId: "co",
  reference: "REF-1",
  description: "Cylindre européen",
  quantity: 0,
  alertThreshold: 3,
  unit: "pcs",
  updatedAt: "2026-05-01",
};

describe("CompanyStockItemList", () => {
  it("renders empty state", () => {
    render(<CompanyStockItemList items={[]} selectedId={null} onSelect={jest.fn()} />);
    expect(screen.getByTestId("company-stock-list-empty")).toBeInTheDocument();
  });

  it("renders grid tiles and calls onSelect", () => {
    const onSelect = jest.fn();
    render(
      <CompanyStockItemList
        items={[item]}
        selectedId={null}
        onSelect={onSelect}
        imageUrls={{ "tile-1": "https://lecot.be/media/catalog/product/demo.jpg" }}
      />
    );

    expect(screen.getByTestId("company-stock-list")).toHaveAttribute("data-layout", "grid-3");
    const card = screen.getByTestId("company-stock-card-tile-1");
    expect(card).toHaveAttribute("data-health", "out");
    expect(card.className).toMatch(/shadow-\[/);
    expect(card.className).toMatch(/\bbg-white\b/);
    expect(card).toHaveAttribute("data-category", "cylinder");
    expect(card.className).toMatch(/aspect-square/);
    expect(screen.getByTestId("company-stock-card-title-tile-1")).toHaveTextContent(
      "Cylindre européen"
    );
    expect(screen.queryByTestId("company-stock-card-category-tile-1")).not.toBeInTheDocument();
    expect(screen.getByTestId("company-stock-card-image-tile-1")).toHaveAttribute(
      "src",
      "https://lecot.be/media/catalog/product/demo.jpg"
    );

    fireEvent.click(card);
    expect(onSelect).toHaveBeenCalledWith("tile-1");
  });
});
