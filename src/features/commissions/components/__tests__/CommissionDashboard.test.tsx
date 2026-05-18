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

jest.mock("@/features/technicians/hooks", () => ({
  useTechnicians: () => ({
    technicians: [
      { id: "t1", name: "Alex", initial: "A", authUid: "tech-uid-1", status: "available", location: { lat: 50, lng: 4 } },
    ],
    loading: false,
  }),
}));

jest.mock("@/features/commissions/commissionFirestore", () => ({
  ...jest.requireActual("@/features/commissions/commissionFirestore"),
  createCommissionRule: jest.fn().mockResolvedValue("rule-id"),
  updateCommissionRule: jest.fn().mockResolvedValue(undefined),
  deleteCommissionRule: jest.fn().mockResolvedValue(undefined),
  createManualCommission: jest.fn().mockResolvedValue("entry-id"),
  subscribeManualCommissions: jest.fn((_, __, cb) => { cb([]); return () => {}; }),
  subscribeCommissionRuleAudit: jest.fn((_, __, cb) => { cb([]); return () => {}; }),
  subscribeCompanyCommissionAudit: jest.fn((_, __, cb) => { cb([]); return () => {}; }),
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

  it("shows manual entry tab and form when clicked", () => {
    render(<CommissionDashboard />);
    fireEvent.click(screen.getByText("Saisie manuelle"));
    expect(screen.getByTestId("manual-commission-form")).toBeInTheDocument();
    expect(screen.getByTestId("manual-commission-tech-uid")).toBeInTheDocument();
    expect(screen.getByTestId("manual-commission-amount")).toBeInTheDocument();
    expect(screen.getByTestId("manual-commission-reason")).toBeInTheDocument();
    expect(screen.getByTestId("manual-commission-date")).toBeInTheDocument();
  });

  it("hides rule form when on manual tab", () => {
    render(<CommissionDashboard />);
    fireEvent.click(screen.getByText("Saisie manuelle"));
    expect(screen.queryByTestId("commission-add-toggle")).not.toBeInTheDocument();
    expect(screen.queryByTestId("commission-rule-form")).not.toBeInTheDocument();
  });

  it("switching back to rules tab shows add-rule button", () => {
    render(<CommissionDashboard />);
    fireEvent.click(screen.getByText("Saisie manuelle"));
    fireEvent.click(screen.getByText("Règles automatiques"));
    expect(screen.getByTestId("commission-add-toggle")).toBeInTheDocument();
  });

  it("shows history tab", () => {
    render(<CommissionDashboard />);
    fireEvent.click(screen.getByTestId("commission-tab-history"));
    expect(screen.getByTestId("commission-history-panel")).toBeInTheDocument();
  });
});
