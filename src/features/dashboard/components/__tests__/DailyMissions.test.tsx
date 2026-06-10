import { screen } from "@testing-library/react";
import { render } from "@/test-utils/render";
import DailyMissions from "@/features/dashboard/components/DailyMissions";

describe("DailyMissions", () => {
  it("shows a 3x4 grid of empty placeholders when there are no missions", () => {
    render(<DailyMissions missions={[]} isEmbedded />);
    expect(screen.getByTestId("daily-missions-empty-grid")).toBeInTheDocument();
    expect(screen.getAllByTestId(/daily-missions-empty-slot-/)).toHaveLength(12);
  });

  it("shows mission cards when missions exist", () => {
    render(
      <DailyMissions
        isEmbedded
        missions={[
          {
            id: 1,
            key: "iv-1",
            clientName: "Dupont",
            coordinates: [4.35, 50.85],
            time: "10:00",
            status: "Assigné",
            statusCode: "assigned",
            source: "live",
            date: "2026-01-01",
          },
        ]}
      />
    );
    expect(screen.queryByTestId("daily-missions-empty-grid")).not.toBeInTheDocument();
    expect(screen.getByTestId("daily-mission-iv-1")).toBeInTheDocument();
    expect(screen.getByText("Dupont")).toBeInTheDocument();
    expect(screen.getAllByTestId(/daily-missions-empty-slot-/)).toHaveLength(11);
  });

  it("pads the grid with empty squares up to 12 slots when there are missions", () => {
    const missions = Array.from({ length: 6 }, (_, i) => ({
      id: i + 1,
      key: `iv-${i + 1}`,
      clientName: `Client ${i + 1}`,
      coordinates: [4.35, 50.85] as [number, number],
      time: "10:00",
      status: "Assigné",
      statusCode: "assigned" as const,
      source: "live" as const,
      date: "2026-01-01",
    }));
    render(<DailyMissions isEmbedded missions={missions} />);
    expect(screen.getByTestId("daily-missions-grid")).toBeInTheDocument();
    expect(screen.getAllByTestId(/daily-missions-empty-slot-/)).toHaveLength(6);
    expect(screen.getByText("Client 1")).toBeInTheDocument();
    expect(screen.getByText("Client 6")).toBeInTheDocument();
  });
});
