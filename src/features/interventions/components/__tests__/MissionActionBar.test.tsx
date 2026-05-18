import { fireEvent, render, screen } from "@/test-utils/render";
import MissionActionBar from "@/features/interventions/components/MissionActionBar";
import type { Intervention } from "@/features/interventions/types";

function iv(status: Intervention["status"]): Intervention {
  return {
    id: "iv-1",
    title: "Test",
    address: "Rue 1",
    time: "10:00",
    status,
    location: { lat: 50.8, lng: 4.35 },
  };
}

describe("MissionActionBar", () => {
  it("renders primary on-site action for en_route", () => {
    render(
      <MissionActionBar
        intervention={iv("en_route")}
        onPrimaryTransition={jest.fn()}
        onFinish={jest.fn()}
      />,
    );
    expect(screen.getByTestId("mission-action-primary-on-site")).toBeInTheDocument();
  });

  it("calls onFinish for in_progress primary", () => {
    const onFinish = jest.fn();
    render(
      <MissionActionBar
        intervention={iv("in_progress")}
        onPrimaryTransition={jest.fn()}
        onFinish={onFinish}
      />,
    );
    fireEvent.click(screen.getByTestId("mission-action-primary-finish"));
    expect(onFinish).toHaveBeenCalled();
  });
});
