import { fireEvent, screen } from "@testing-library/react";
import { render } from "@/test-utils/render";
import InterventionCommissionPanel from "@/features/commissions/components/InterventionCommissionPanel";

jest.mock("@/features/commissions/useInterventionCommission", () => ({
  useInterventionCommission: () => ({
    loading: false,
    commission: {
      id: "iv-done-1",
      interventionId: "iv-done-1",
      baseAmount: 150,
      finalCommissionAmount: 22.5,
      appliedRuleId: "rule-1",
      isManualOverride: false,
      updatedAt: "2026-05-17T10:00:00.000Z",
    },
  }),
}));

jest.mock("@/features/commissions/computeInterventionCommission", () => ({
  computeAndPersistInterventionCommission: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("@/features/commissions/commissionFirestore", () => ({
  saveCommissionOverride: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("sonner", () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}));

const intervention = {
  id: "iv-done-1",
  status: "done" as const,
  companyId: "co-test",
  assignedTechnicianUid: "tech-1",
  invoiceAmountCents: 15000,
  commissionAmountCents: 2250,
};

describe("InterventionCommissionPanel", () => {
  it("shows commission amount for done intervention", () => {
    render(<InterventionCommissionPanel intervention={intervention} />);
    expect(screen.getByTestId("intervention-commission-panel")).toBeInTheDocument();
    expect(screen.getByTestId("commission-amount-display")).toHaveTextContent("22.50");
  });

  it("opens override form", () => {
    render(<InterventionCommissionPanel intervention={intervention} />);
    fireEvent.click(screen.getByTestId("commission-override-open"));
    expect(screen.getByTestId("commission-override-form")).toBeInTheDocument();
  });
});
