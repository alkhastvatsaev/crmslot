import { renderHook, waitFor } from "@testing-library/react";
import { fetchWithAuth } from "@/core/api/fetchWithAuth";
import { useCompanyStockImages } from "@/features/featureHub/hooks/useCompanyStockImages";
import type { StockItem } from "@/features/materials";

jest.mock("@/core/api/fetchWithAuth", () => ({
  fetchWithAuth: jest.fn(),
}));

const mockFetchWithAuth = fetchWithAuth as jest.MockedFunction<typeof fetchWithAuth>;

const item: StockItem = {
  id: "s1",
  companyId: "co",
  reference: "LEC-1",
  description: "Cylindre",
  quantity: 1,
  alertThreshold: 2,
  unit: "pcs",
  updatedAt: "2026-05-01",
};

describe("useCompanyStockImages", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    mockFetchWithAuth.mockReset();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("uses direct imageUrl without API call", async () => {
    const withImage: StockItem = {
      ...item,
      imageUrl: "https://cdn.example/direct.jpg",
    };

    const { result } = renderHook(() => useCompanyStockImages([withImage]));

    jest.advanceTimersByTime(300);

    await waitFor(() => {
      expect(result.current.s1).toBe("https://cdn.example/direct.jpg");
    });
    expect(mockFetchWithAuth).not.toHaveBeenCalled();
  });

  it("uses local overlay without API call", async () => {
    const serrure: StockItem = {
      ...item,
      id: "serr-apl",
      reference: "SERR-APL",
      lecotSku: "LEC-SER-1014",
      description: "Serrure applique A2P",
    };

    const { result } = renderHook(() => useCompanyStockImages([serrure]));

    jest.advanceTimersByTime(300);

    await waitFor(() => {
      expect(result.current["serr-apl"]).toMatch(/^https:\/\/lecot\.be\//);
    });
    expect(mockFetchWithAuth).not.toHaveBeenCalled();
  });

  it("loads batch images from API", async () => {
    mockFetchWithAuth.mockResolvedValue({
      ok: true,
      json: async () => ({ images: { "LEC-1": "https://lecot.be/media/x.jpg" } }),
    } as Response);

    const { result } = renderHook(() => useCompanyStockImages([item]));

    jest.advanceTimersByTime(300);

    await waitFor(() => {
      expect(result.current.s1).toBe("https://lecot.be/media/x.jpg");
    });

    expect(mockFetchWithAuth).toHaveBeenCalledWith(
      "/api/catalog/lecot-images",
      expect.objectContaining({ method: "POST" })
    );
  });
});
