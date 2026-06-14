import { fireEvent, render, screen } from "@/test-utils/render";
import RequesterTrackingCaseGrid, {
  TRACKING_CASE_GRID_SLOTS,
} from "@/features/interventions/components/RequesterTrackingCaseGrid";

describe("RequesterTrackingCaseGrid", () => {
  it("renders a 3x3 grid with empty slots for upcoming cases", () => {
    render(
      <RequesterTrackingCaseGrid
        cases={[
          {
            id: "iv-1",
            title: "Porte claquée",
            lastName: "Bach",
            statusKey: "invoiced",
            statusLabel: "Facturé",
            dateLabel: "07 juin",
            statusPillClassName: "bg-green-100 text-green-700",
          },
          {
            id: "iv-2",
            title: "Chaudière",
            statusKey: "pending",
            statusLabel: "En attente",
            dateLabel: "08 juin",
            statusPillClassName: "bg-slate-100 text-slate-500",
          },
        ]}
        onSelect={jest.fn()}
      />
    );

    expect(screen.getByTestId("tracking-case-grid")).toBeInTheDocument();
    expect(screen.getByTestId("tracking-case-card-iv-1")).toBeInTheDocument();
    expect(screen.getByTestId("tracking-case-lastname-iv-1")).toHaveTextContent("Bach");
    expect(screen.getByTestId("tracking-case-card-iv-2")).toBeInTheDocument();
    expect(screen.getAllByTestId(/tracking-case-empty-slot-/)).toHaveLength(
      TRACKING_CASE_GRID_SLOTS - 2
    );
  });

  it("calls onSelect when a case card is clicked", () => {
    const onSelect = jest.fn();
    render(
      <RequesterTrackingCaseGrid
        cases={[
          {
            id: "iv-1",
            title: "Porte claquée",
            lastName: "Bach",
            statusKey: "invoiced",
            statusLabel: "Facturé",
            dateLabel: "07 juin",
            statusPillClassName: "bg-green-100 text-green-700",
          },
        ]}
        onSelect={onSelect}
      />
    );

    fireEvent.click(screen.getByTestId("tracking-case-card-iv-1"));
    expect(onSelect).toHaveBeenCalledWith("iv-1");
  });
});
