import { fireEvent, screen } from "@testing-library/react";
import { render } from "@/test-utils/render";
import TechnicianMonthCalendar from "@/features/interventions/components/TechnicianMonthCalendar";
import { DateProvider } from "@/context/DateContext";
import type { Intervention } from "@/features/interventions/types";

function iv(partial: Partial<Intervention> = {}): Intervention {
  return {
    id: "iv-cal-ui",
    title: "Porte",
    address: "Rue Test",
    time: "09:00",
    status: "en_route",
    location: { lat: 50.8, lng: 4.35 },
    assignedTechnicianUid: "tech-1",
    technicianAcceptedAt: "2026-06-01T08:00:00.000Z",
    scheduledDate: "2026-06-20",
    scheduledTime: "09:00",
    ...partial,
  };
}

describe("TechnicianMonthCalendar", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2026-06-19T09:00:00"));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("renders month grid with mission count and selects a day", () => {
    const onClose = jest.fn();

    render(
      <DateProvider>
        <TechnicianMonthCalendar interventions={[iv()]} technicianUid="tech-1" onClose={onClose} />
      </DateProvider>
    );

    expect(screen.getByTestId("technician-month-calendar")).toBeInTheDocument();
    expect(screen.getByTestId("technician-calendar-day-2026-06-20")).toHaveAttribute(
      "data-calendar-tone",
      "scheduled"
    );
    expect(screen.getByTestId("technician-calendar-day-count-2026-06-20")).toHaveTextContent("1");

    fireEvent.click(screen.getByTestId("technician-calendar-day-2026-06-20"));
    expect(onClose).toHaveBeenCalled();
  });

  it("closes from header button", () => {
    const onClose = jest.fn();
    render(
      <DateProvider>
        <TechnicianMonthCalendar interventions={[]} technicianUid="tech-1" onClose={onClose} />
      </DateProvider>
    );

    fireEvent.click(screen.getByTestId("technician-calendar-close"));
    expect(onClose).toHaveBeenCalled();
  });
});
