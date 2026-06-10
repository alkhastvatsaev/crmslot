import {
  lecotApiBaseUrl,
  lecotApiSearchPath,
  searchLecotViaApi,
} from "@/features/catalog/lecotApiSearch";

describe("lecotApiSearch", () => {
  const env = process.env;

  beforeEach(() => {
    process.env = { ...env };
    delete process.env.LECOT_API_URL;
    delete process.env.LECOT_API_BASE_URL;
    delete process.env.LECOT_API_KEY;
    global.fetch = jest.fn();
  });

  afterAll(() => {
    process.env = env;
  });

  it("returns null when API URL is not configured", async () => {
    expect(lecotApiBaseUrl()).toBeNull();
    await expect(searchLecotViaApi("cyl")).resolves.toBeNull();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("uses default search path", () => {
    expect(lecotApiSearchPath()).toBe("/products/search");
  });

  it("maps API hits to catalog products", async () => {
    process.env.LECOT_API_URL = "https://lecot.example";
    process.env.LECOT_API_KEY = "secret";
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        products: [
          {
            sku: "LEC-1",
            name: "Cylindre",
            price: 35,
            imageUrl: "https://lecot.example/media/cyl.jpg",
          },
        ],
      }),
    });

    const rows = await searchLecotViaApi("cyl");
    expect(rows).toEqual([
      {
        sku: "LEC-1",
        label: "Cylindre",
        unitPriceCents: 3500,
        imageUrl: "https://lecot.example/media/cyl.jpg",
      },
    ]);
  });
});
