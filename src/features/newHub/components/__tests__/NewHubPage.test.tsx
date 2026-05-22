import { screen } from "@testing-library/react";
import { renderWithPager } from "@/test-utils/renderWithPager";
import NewHubPage from "@/features/newHub/components/NewHubPage";
import { NEW_HUB_SLOT_INDEX } from "@/features/newHub/newHubConstants";

describe("NewHubPage", () => {
  it("renders all three empty rails on slot 7", () => {
    renderWithPager(<NewHubPage />, NEW_HUB_SLOT_INDEX + 1);
    expect(screen.getByTestId(`dashboard-pager-slot-${NEW_HUB_SLOT_INDEX}`)).toBeInTheDocument();
    expect(screen.getByTestId("new-hub-panel-left")).toBeInTheDocument();
    expect(screen.getByTestId("new-hub-panel-center")).toBeInTheDocument();
    expect(screen.getByTestId("new-hub-panel-right")).toBeInTheDocument();
  });
});
