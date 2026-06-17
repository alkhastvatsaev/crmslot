import { renderHook, waitFor } from "@testing-library/react";
import { locksmithStockCatalogRows } from "@/features/catalog/locksmithStockSeedCatalog";
import { useCompanyStockItems } from "@/features/featureHub/hooks/useCompanyStockItems";
import { subscribeStockItems } from "@/features/materials/stockFirestore";

jest.mock("@/features/materials/stockFirestore", () => ({
  subscribeStockItems: jest.fn(),
}));

const mockSubscribeStockItems = subscribeStockItems as jest.MockedFunction<
  typeof subscribeStockItems
>;

describe("useCompanyStockItems", () => {
  beforeEach(() => {
    mockSubscribeStockItems.mockReset();
  });

  it("exposes locksmith preview catalog when live stock is empty", async () => {
    mockSubscribeStockItems.mockImplementation((_companyId, onRows) => {
      onRows([]);
      return () => {};
    });

    const { result } = renderHook(() => useCompanyStockItems("co-abc"));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.isPreviewCatalog).toBe(true);
    expect(result.current.hasLiveStock).toBe(false);
    expect(result.current.items).toHaveLength(locksmithStockCatalogRows().length);
    expect(result.current.items[0]?.companyId).toBe("co-abc");
    expect(result.current.items[0]?.lecotSku).toBeTruthy();
  });

  it("uses live Firestore rows when stock exists", async () => {
    const live = [
      {
        id: "live-1",
        companyId: "co-abc",
        reference: "REF-LIVE",
        description: "Article réel",
        quantity: 3,
        alertThreshold: 2,
        unit: "pcs",
        updatedAt: "2026-06-01",
      },
    ];

    mockSubscribeStockItems.mockImplementation((_companyId, onRows) => {
      onRows(live);
      return () => {};
    });

    const { result } = renderHook(() => useCompanyStockItems("co-abc"));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.isPreviewCatalog).toBe(false);
    expect(result.current.hasLiveStock).toBe(true);
    expect(result.current.items).toEqual(live);
  });
});
