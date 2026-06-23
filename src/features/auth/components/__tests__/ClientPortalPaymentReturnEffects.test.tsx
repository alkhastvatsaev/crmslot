import { render } from "@/test-utils/render";
import ClientPortalPaymentReturnEffects from "@/features/auth/components/ClientPortalPaymentReturnEffects";

const mockReplace = jest.fn();
const mockSetPageIndex = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mockReplace }),
  useSearchParams: () => new URLSearchParams("payment=success&interventionId=iv-pay-1"),
}));

jest.mock("sonner", () => ({
  toast: { success: jest.fn() },
}));

jest.mock("@/features/dashboard/dashboardPagerContext", () => ({
  useDashboardPagerOptional: () => ({ setPageIndex: mockSetPageIndex, pageIndex: 0 }),
}));

const mockSetLastSubmittedInterventionId = jest.fn();
const mockSetPendingTrackingInterventionId = jest.fn();

const mockSetPortalRightTab = jest.fn();

jest.mock("@/context/RequesterHubContext", () => ({
  useRequesterHub: () => ({
    setLastSubmittedInterventionId: mockSetLastSubmittedInterventionId,
    setPendingTrackingInterventionId: mockSetPendingTrackingInterventionId,
    setPortalRightTab: mockSetPortalRightTab,
  }),
}));

const mockNavigateCompanyHub = jest.fn();

jest.mock("@/features/company/companyHubNavigation", () => ({
  ...jest.requireActual("@/features/company/companyHubNavigation"),
  navigateCompanyHub: (...args: unknown[]) => mockNavigateCompanyHub(...args),
}));

describe("ClientPortalPaymentReturnEffects", () => {
  beforeEach(() => {
    mockReplace.mockClear();
    mockSetPageIndex.mockClear();
    mockNavigateCompanyHub.mockClear();
  });

  it("navigates to company hub and cleans URL on payment success", () => {
    render(<ClientPortalPaymentReturnEffects />);
    expect(mockNavigateCompanyHub).toHaveBeenCalledWith(
      expect.objectContaining({ setPageIndex: mockSetPageIndex }),
      "company-hub-client-portal"
    );
    expect(mockSetPendingTrackingInterventionId).toHaveBeenCalledWith("iv-pay-1");
    expect(mockSetPortalRightTab).toHaveBeenCalledWith("tracking");
    expect(mockReplace).toHaveBeenCalled();
  });
});
