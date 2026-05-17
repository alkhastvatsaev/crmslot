import { fireEvent, screen } from "@testing-library/react";
import { render } from "@/test-utils/render";
import { CommissionDashboard } from "@/features/commissions/components/CommissionDashboard";

jest.mock("@/context/CompanyWorkspaceContext", () => ({
  useCompanyWorkspaceOptional: () => ({
    isTenantUser: true,
    activeCompanyId: "co-test",
  }),
}));

jest.mock("@/features/commissions/useCommissionRules", () => ({
  useCommissionRules: () => ({ rules: [], loading: false }),
}));

describe("CommissionDashboard", () => {
  it("renders dashboard and opens rule form", () => {
    render(<CommissionDashboard />);
    expect(screen.getByTestId("commission-dashboard")).toBeInTheDocument();
    fireEvent.click(screen.getByTestId("commission-add-toggle"));
    expect(screen.getByTestId("commission-rule-form")).toBeInTheDocument();
  });

  it("prefills group target with active company id", () => {
    render(<CommissionDashboard />);
    fireEvent.click(screen.getByTestId("commission-add-toggle"));
    const target = screen.getByTestId("commission-target-input") as HTMLInputElement;
    expect(target.value).toBe("co-test");
    expect(target.readOnly).toBe(true);
  });
});
