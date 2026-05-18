import { screen } from "@testing-library/react";
import { render } from "@/test-utils/render";
import CompanyCatalogPanel from "@/features/catalog/components/CompanyCatalogPanel";

jest.mock("@/core/useFeatureFlags", () => ({
  useFeatureFlag: (key: string) => key === "lecotProductSearch",
}));

jest.mock("@/context/CompanyWorkspaceContext", () => ({
  useCompanyWorkspaceOptional: () => ({
    activeCompanyId: "co-test",
    activeRole: "admin",
  }),
}));

jest.mock("@/features/catalog/useCompanyCatalog", () => ({
  useCompanyCatalog: () => ({
    products: [{ id: "p1", companyId: "co-test", sku: "A1", label: "Test", unitPriceCents: 100, isActive: true, createdAt: "", updatedAt: "" }],
    loading: false,
  }),
}));

jest.mock("@/features/catalog/catalogFirestore", () => ({
  createCatalogProduct: jest.fn().mockResolvedValue("p-new"),
}));

describe("CompanyCatalogPanel", () => {
  it("renders catalog form for admin", () => {
    render(<CompanyCatalogPanel />);
    expect(screen.getByTestId("company-catalog-panel")).toBeInTheDocument();
    expect(screen.getByTestId("company-catalog-row-p1")).toHaveTextContent("Test");
  });
});
