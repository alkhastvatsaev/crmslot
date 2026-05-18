/** @jest-environment jsdom */

import { render, screen, fireEvent, waitFor } from "@/test-utils/render";
import ProductQuickAddBar from "@/features/catalog/components/ProductQuickAddBar";

jest.mock("@/core/useFeatureFlags", () => ({
  useFeatureFlag: (key: string) => key === "lecotProductSearch",
}));

jest.mock("@/core/api/fetchWithAuth", () => ({
  fetchWithAuth: jest.fn(),
}));

import { fetchWithAuth } from "@/core/api/fetchWithAuth";

const mockFetchWithAuth = fetchWithAuth as jest.MockedFunction<typeof fetchWithAuth>;

describe("ProductQuickAddBar", () => {
  beforeEach(() => {
    mockFetchWithAuth.mockResolvedValue({
      ok: true,
      json: async () => ({
        products: [{ sku: "LEC-3001", label: "Cylindre européen", unitPriceCents: 3500 }],
      }),
    } as Response);
  });

  it("renders local suggestions then remote results", async () => {
    const onAddLine = jest.fn();
    render(
      <ProductQuickAddBar
        intervention={{ category: "serrurerie", problem: "Porte" }}
        onAddLine={onAddLine}
      />,
    );

    expect(screen.getByTestId("product-quick-add-bar")).toBeInTheDocument();
    expect(screen.getByTestId("product-quick-add-results")).toBeInTheDocument();

    fireEvent.change(screen.getByTestId("product-quick-add-input"), {
      target: { value: "cylindre" },
    });

    await waitFor(() => {
      expect(mockFetchWithAuth).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(screen.getByTestId("product-quick-add-LEC-3001")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("product-quick-add-LEC-3001"));
    expect(onAddLine).toHaveBeenCalledWith(
      expect.objectContaining({
        reference: "LEC-3001",
        description: "Cylindre européen",
      }),
    );
  });
});
