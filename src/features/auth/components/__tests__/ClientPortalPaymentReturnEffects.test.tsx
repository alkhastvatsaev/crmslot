import { render } from "@/test-utils/render";
import ClientPortalPaymentReturnEffects from "@/features/auth/components/ClientPortalPaymentReturnEffects";

const mockReplace = jest.fn();
const mockSetPageIndex = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mockReplace }),
  useSearchParams: () =>
    new URLSearchParams("payment=success&interventionId=iv-pay-1"),
}));

jest.mock("sonner", () => ({
  toast: { success: jest.fn() },
}));

jest.mock("@/features/dashboard/dashboardPagerContext", () => ({
  useDashboardPagerOptional: () => ({ setPageIndex: mockSetPageIndex, pageIndex: 0 }),
}));

describe("ClientPortalPaymentReturnEffects", () => {
  beforeEach(() => {
    mockReplace.mockClear();
    mockSetPageIndex.mockClear();
  });

  it("navigates to company hub and cleans URL on payment success", () => {
    render(<ClientPortalPaymentReturnEffects />);
    expect(mockSetPageIndex).toHaveBeenCalledWith(1);
    expect(mockReplace).toHaveBeenCalled();
  });
});
