import { fireEvent, screen, waitFor } from "@testing-library/react";
import { updateDoc } from "firebase/firestore";
import { render } from "@/test-utils/render";
import InterventionInvoiceAmountField from "@/features/commissions/components/InterventionInvoiceAmountField";
import { computeAndPersistInterventionCommission } from "@/features/commissions/computeInterventionCommission";

const mockUpdateDoc = updateDoc as jest.MockedFunction<typeof updateDoc>;

jest.mock("@/features/commissions/computeInterventionCommission", () => ({
  computeAndPersistInterventionCommission: jest.fn().mockResolvedValue(undefined),
}));

const mockCompute = computeAndPersistInterventionCommission as jest.MockedFunction<
  typeof computeAndPersistInterventionCommission
>;

jest.mock("sonner", () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}));

describe("InterventionInvoiceAmountField", () => {
  beforeEach(() => {
    mockUpdateDoc.mockClear();
    mockUpdateDoc.mockResolvedValue(undefined);
    mockCompute.mockClear();
  });

  it("renders default amount when invoice cents missing", () => {
    render(
      <InterventionInvoiceAmountField
        intervention={{
          id: "iv-1",
          status: "done",
          companyId: "co-test",
          assignedTechnicianUid: "tech-1",
          invoiceAmountCents: null,
        }}
      />,
    );
    expect(screen.getByTestId("invoice-amount-input")).toHaveValue(150);
  });

  it("saves invoice amount and recalculates commission", async () => {
    render(
      <InterventionInvoiceAmountField
        intervention={{
          id: "iv-1",
          status: "done",
          companyId: "co-test",
          assignedTechnicianUid: "tech-1",
          invoiceAmountCents: 12000,
        }}
      />,
    );
    fireEvent.change(screen.getByTestId("invoice-amount-input"), { target: { value: "200" } });
    fireEvent.click(screen.getByTestId("invoice-amount-save"));

    await waitFor(() => expect(mockUpdateDoc).toHaveBeenCalled());
    await waitFor(() => expect(mockCompute).toHaveBeenCalled());
    expect(mockCompute.mock.calls[0]?.[0].invoiceAmountCents).toBe(20000);
  });
});
