import { render, screen } from "@/test-utils/render";
import TechnicianMobileApp from "@/features/interventions/components/TechnicianMobileApp";

jest.mock("@/features/auth/components/LoginOverlay", () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

jest.mock("@/features/interventions/components/TechnicianHubPage", () => ({
  __esModule: true,
  default: ({ slotIndex }: { slotIndex: number }) => (
    <div data-testid={`technician-hub-slot-${slotIndex}`} />
  ),
}));

jest.mock("@/features/app/DesktopOnlyGate", () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

jest.mock("@/features/dev/DevServiceWorkerCleanup", () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock("@/features/dev/StagingPreviewBanner", () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock("@/features/notifications/components/TechnicianNotificationBootstrap", () => ({
  __esModule: true,
  default: () => null,
}));

describe("TechnicianMobileApp", () => {
  it("monte la shell terrain sans le carrousel 8 pages", () => {
    render(<TechnicianMobileApp />);
    expect(screen.getByTestId("technician-mobile-app")).toBeInTheDocument();
    expect(screen.getByTestId("technician-hub-slot-0")).toBeInTheDocument();
  });
});
