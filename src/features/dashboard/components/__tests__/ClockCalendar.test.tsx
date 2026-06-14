import { fireEvent, render, screen } from "@/test-utils/render";
import ClockCalendar from "@/features/dashboard/components/ClockCalendar";
import { DateProvider } from "@/context/DateContext";
import {
  DashboardPageSelectorProvider,
  useDashboardPageSelector,
} from "@/features/dashboard/DashboardPageSelectorContext";

describe("ClockCalendar", () => {
  it("toggle le sélecteur de pages au clic date/heure en mode compact interactif", () => {
    function ToggleProbe() {
      const { open } = useDashboardPageSelector();
      return <div data-testid="selector-state">{open ? "open" : "closed"}</div>;
    }

    render(
      <DateProvider>
        <DashboardPageSelectorProvider>
          <ClockCalendar compact interactive />
          <ToggleProbe />
        </DashboardPageSelectorProvider>
      </DateProvider>
    );

    expect(screen.getByTestId("selector-state")).toHaveTextContent("closed");
    fireEvent.click(screen.getByTestId("clock-calendar-toggle"));
    expect(screen.getByTestId("selector-state")).toHaveTextContent("open");
  });

  it("ne rend pas le bouton toggle sans mode interactif", () => {
    render(
      <DateProvider>
        <DashboardPageSelectorProvider>
          <ClockCalendar compact />
        </DashboardPageSelectorProvider>
      </DateProvider>
    );

    expect(screen.queryByTestId("clock-calendar-toggle")).not.toBeInTheDocument();
  });
});
