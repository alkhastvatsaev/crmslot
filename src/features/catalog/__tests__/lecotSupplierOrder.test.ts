import { lecotApiBaseUrl } from "@/features/catalog/lecotApiSearch";
import { submitLecotSupplierOrder } from "@/features/catalog/lecotSupplierOrder";

jest.mock("@/features/catalog/lecotApiSearch", () => ({
  lecotApiBaseUrl: jest.fn(),
}));

const mockBase = lecotApiBaseUrl as jest.MockedFunction<typeof lecotApiBaseUrl>;

describe("submitLecotSupplierOrder", () => {
  const lines = [{ sku: "A1", label: "Pièce", quantity: 1, unitPriceCents: 100 }];

  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
  });

  it("returns manual when API not configured", async () => {
    mockBase.mockReturnValue(null);
    const result = await submitLecotSupplierOrder({ lines });
    expect(result.ok).toBe(true);
    if (result.ok && result.source === "manual") {
      expect(result.lines).toEqual(lines);
    }
  });

  it("posts to Lecot API when configured", async () => {
    mockBase.mockReturnValue("https://api.lecot.test");
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ orderId: "EXT-1" }),
    });

    const result = await submitLecotSupplierOrder({ lines, notes: "Urgent" });
    expect(result).toEqual({ ok: true, source: "api", orderId: "EXT-1" });
    expect(global.fetch).toHaveBeenCalled();
  });
});
