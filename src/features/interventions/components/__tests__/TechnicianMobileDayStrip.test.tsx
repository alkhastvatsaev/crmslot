import { buildTechnicianMissionPresentation } from "@/features/interventions/technicianMissionPresentation";
import { fireEvent, render, screen } from "@/test-utils/render";
import TechnicianMobileDayStrip from "@/features/interventions/components/TechnicianMobileDayStrip";
import type { Intervention } from "@/features/interventions/types";

const t = (key: string) => {
  const map: Record<string, string> = {
    "technician_hub.dashboard.detail.not_provided": "—",
  };
  return map[key] ?? key;
};

describe("TechnicianMobileDayStrip", () => {
  const missions: Intervention[] = [
    {
      id: "iv-a",
      title: "A",
      address: "Rue 1",
      time: "09:00",
      status: "en_route",
      scheduledDate: "2026-05-16",
      scheduledTime: "09:00",
      clientFirstName: "Paul",
      location: { lat: 50.8, lng: 4.35 },
    },
    {
      id: "iv-b",
      title: "B",
      address: "Rue 2",
      time: "11:30",
      status: "assigned",
      scheduledDate: "2026-05-16",
      scheduledTime: "11:30",
      clientFirstName: "Lisa",
      location: { lat: 50.8, lng: 4.35 },
    },
  ];

  it("renders mission chips and highlights selection", () => {
    const onSelect = jest.fn();
    render(
      <TechnicianMobileDayStrip missions={missions} selectedId="iv-a" onSelect={onSelect} t={t} />
    );

    const chipA = screen.getByTestId("technician-mobile-mission-chip-iv-a");
    expect(chipA).toHaveAttribute("data-selected", "true");
    expect(chipA).toHaveTextContent("09:00");
    expect(chipA).toHaveTextContent("Paul");

    fireEvent.click(screen.getByTestId("technician-mobile-mission-chip-iv-b"));
    expect(onSelect).toHaveBeenCalledWith("iv-b");
  });

  it("shows empty strip placeholder", () => {
    render(<TechnicianMobileDayStrip missions={[]} selectedId={null} onSelect={jest.fn()} t={t} />);
    expect(screen.getByTestId("technician-mobile-day-strip-empty")).toBeInTheDocument();
  });
});

describe("buildTechnicianMissionPresentation short label", () => {
  it("uses first name for strip label", () => {
    const p = buildTechnicianMissionPresentation(
      {
        id: "x",
        title: "T",
        address: "A",
        time: "08:00",
        status: "assigned",
        clientFirstName: "anna",
        clientLastName: "lee",
        location: { lat: 0, lng: 0 },
      },
      t
    );
    expect(p.shortClientLabel).toBe("Anna");
  });
});
