import { render, screen } from "@/test-utils/render";
import MapPageSlot from "@/features/map/components/MapPageSlot";

jest.mock("@/features/dashboard/hooks/useIsMobile", () => ({
  useIsMobile: jest.fn(() => false),
}));

jest.mock("@/core/useFeatureFlags", () => ({
  useFeatureFlag: jest.fn(() => false),
}));

jest.mock("@/features/map/components/MapboxView", () => ({
  __esModule: true,
  default: () => <div data-testid="mapbox-view-stub" />,
}));

jest.mock("@/features/map/components/MobileMapHubLite", () => ({
  __esModule: true,
  default: () => <div data-testid="mobile-map-hub-lite-stub" />,
}));

jest.mock("@/features/map/components/MapMobileDispatchArmButton", () => ({
  __esModule: true,
  default: () => null,
}));

const useIsMobile = jest.requireMock("@/features/dashboard/hooks/useIsMobile")
  .useIsMobile as jest.Mock;
const useFeatureFlag = jest.requireMock("@/core/useFeatureFlags").useFeatureFlag as jest.Mock;

describe("MapPageSlot", () => {
  beforeEach(() => {
    useIsMobile.mockReturnValue(false);
    useFeatureFlag.mockReturnValue(false);
  });

  it("charge Mapbox sur desktop", async () => {
    render(<MapPageSlot />);
    expect(await screen.findByTestId("mapbox-view-stub")).toBeInTheDocument();
    expect(screen.queryByTestId("mobile-map-hub-lite-stub")).not.toBeInTheDocument();
  });

  it("charge la carte lite sur mobile sans WebGL", async () => {
    useIsMobile.mockReturnValue(true);
    useFeatureFlag.mockReturnValue(false);
    render(<MapPageSlot />);
    expect(await screen.findByTestId("mobile-map-hub-lite-stub")).toBeInTheDocument();
    expect(screen.queryByTestId("mapbox-view-stub")).not.toBeInTheDocument();
  });

  it("charge Mapbox sur mobile si mobileMapWebGL", async () => {
    useIsMobile.mockReturnValue(true);
    useFeatureFlag.mockReturnValue(true);
    render(<MapPageSlot />);
    expect(await screen.findByTestId("mapbox-view-stub")).toBeInTheDocument();
  });
});
