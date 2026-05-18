import { render, screen } from "@/test-utils/render";
import ScheduleDragBoard from "@/features/scheduling/components/ScheduleDragBoard";

const flagState = { pwaV2: true };

jest.mock("@/core/useFeatureFlags", () => ({
  useFeatureFlag: (key: string) => (key === "pwaV2Bundle" ? flagState.pwaV2 : false),
}));

jest.mock("@/features/technicians/hooks", () => ({
  useTechnicians: () => ({
    technicians: [{ id: "tech-1", name: "Jean", status: "available" }],
    loading: false,
  }),
}));

describe("ScheduleDragBoard", () => {
  beforeEach(() => {
    flagState.pwaV2 = true;
  });

  it("renders when pwa v2 enabled", () => {
    render(
      <ScheduleDragBoard
        interventions={[]}
        technicianUid="tech-1"
        onTechnicianChange={jest.fn()}
        dateYmd="2026-05-18"
        onDateChange={jest.fn()}
        onSchedule={jest.fn()}
      />,
    );
    expect(screen.getByTestId("schedule-drag-board")).toBeInTheDocument();
  });

  it("hidden when flag off", () => {
    flagState.pwaV2 = false;
    const { container } = render(
      <ScheduleDragBoard
        interventions={[]}
        technicianUid="tech-1"
        onTechnicianChange={jest.fn()}
        dateYmd="2026-05-18"
        onDateChange={jest.fn()}
        onSchedule={jest.fn()}
      />,
    );
    expect(container.firstChild).toBeNull();
  });
});
