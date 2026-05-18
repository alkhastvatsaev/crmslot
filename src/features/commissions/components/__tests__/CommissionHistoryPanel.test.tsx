import { render, screen } from "@/test-utils/render";
import CommissionHistoryPanel from "@/features/commissions/components/CommissionHistoryPanel";

jest.mock("@/features/commissions/commissionFirestore", () => ({
  subscribeCommissionRuleAudit: jest.fn((_, __, cb) => {
    cb([]);
    return () => {};
  }),
  subscribeCompanyCommissionAudit: jest.fn((_, __, cb) => {
    cb([]);
    return () => {};
  }),
}));

describe("CommissionHistoryPanel", () => {
  it("renders empty state sections", () => {
    render(<CommissionHistoryPanel companyId="co-1" />);
    expect(screen.getByTestId("commission-history-panel")).toBeInTheDocument();
    expect(screen.getByTestId("commission-rule-audit-empty")).toBeInTheDocument();
    expect(screen.getByTestId("commission-iv-audit-empty")).toBeInTheDocument();
  });
});
