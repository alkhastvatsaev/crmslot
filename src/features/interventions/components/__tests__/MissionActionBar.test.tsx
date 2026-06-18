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
      />
    );
    expect(screen.getByTestId("mission-action-primary-on-site")).toBeInTheDocument();
    expect(screen.queryByRole("slider")).not.toBeInTheDocument();
  });

  it("calls onPrimaryTransition when on-site button is clicked", () => {
    const onPrimaryTransition = jest.fn();
    render(
      <MissionActionBar
        intervention={iv("en_route")}
        onPrimaryTransition={onPrimaryTransition}
        onFinish={jest.fn()}
      />
    );
    fireEvent.click(screen.getByTestId("mission-action-primary-on-site"));
    expect(onPrimaryTransition).toHaveBeenCalledWith("in_progress");
  });

  it("calls onFinish for in_progress primary", () => {
    const onFinish = jest.fn();
    render(
      <MissionActionBar
        intervention={iv("in_progress")}
        onPrimaryTransition={jest.fn()}
        onFinish={onFinish}
        onWaitingMaterial={jest.fn()}
      />
    );
    fireEvent.click(screen.getByTestId("mission-action-primary-finish"));
    expect(onFinish).toHaveBeenCalled();
  });

  it("reveals waiting material action behind more toggle", () => {
    const onWaitingMaterial = jest.fn();
    render(
      <MissionActionBar
        intervention={iv("in_progress")}
        onPrimaryTransition={jest.fn()}
        onFinish={jest.fn()}
        onWaitingMaterial={onWaitingMaterial}
      />
    );
    expect(screen.queryByTestId("technician-waiting-material-btn")).not.toBeInTheDocument();
    fireEvent.click(screen.getByTestId("mission-more-toggle"));
    fireEvent.click(screen.getByTestId("technician-waiting-material-btn"));
    expect(onWaitingMaterial).toHaveBeenCalled();
  });
});
