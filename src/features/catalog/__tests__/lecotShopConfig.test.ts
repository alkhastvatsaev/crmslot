import {
  lecotShopBaseUrl,
  lecotShopCatalogSearchUrl,
  lecotShopCredentials,
  LECOT_SHOP_DEFAULT_URL,
} from "@/features/catalog/lecotShopConfig";

describe("lecotShopConfig", () => {
  const env = process.env;

  beforeEach(() => {
    process.env = { ...env };
    delete process.env.LECOT_SHOP_URL;
    delete process.env.LECOT_SHOP_EMAIL;
    delete process.env.LECOT_SHOP_PASSWORD;
  });

  afterAll(() => {
    process.env = env;
  });

  it("defaults to lecot.be", () => {
    expect(lecotShopBaseUrl()).toBe(LECOT_SHOP_DEFAULT_URL);
    expect(lecotShopCatalogSearchUrl("vis")).toContain("lecot.be");
    expect(lecotShopCatalogSearchUrl("vis")).toContain("vis");
  });

  it("reads credentials from env only", () => {
    expect(lecotShopCredentials()).toBeNull();
    process.env.LECOT_SHOP_EMAIL = "user@example.com";
    process.env.LECOT_SHOP_PASSWORD = "secret";
    expect(lecotShopCredentials()).toEqual({ email: "user@example.com", password: "secret" });
  });
});
