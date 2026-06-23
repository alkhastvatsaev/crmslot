import { render, screen } from "@/test-utils/render";
import MapPageSlot from "@/features/map/components/MapPageSlot";

jest.mock("@/features/map/components/MapboxView", () => ({
  __esModule: true,
  default: () => <div data-testid="mapbox-view-stub" />,
}));

describe("MapPageSlot", () => {
  it("charge toujours MapboxView", async () => {
    render(<MapPageSlot />);
    expect(await screen.findByTestId("mapbox-view-stub")).toBeInTheDocument();
  });
});
