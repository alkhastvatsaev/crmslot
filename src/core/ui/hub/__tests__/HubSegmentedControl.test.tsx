import { fireEvent, render, screen } from "@testing-library/react";
import HubSegmentedControl from "@/core/ui/hub/HubSegmentedControl";

const OPTIONS = [
  { id: "a", label: "Tab A", testId: "hub-tab-a", activeAccent: "blue" as const },
  { id: "b", label: "Tab B", testId: "hub-tab-b", badge: 3, badgeAccent: "emerald" as const },
];

describe("HubSegmentedControl", () => {
  it("marks the active tab with aria-selected", () => {
    render(
      <HubSegmentedControl value="a" onChange={() => {}} options={OPTIONS} ariaLabel="Test tabs" />
    );

    expect(screen.getByTestId("hub-tab-a")).toHaveAttribute("aria-selected", "true");
    expect(screen.getByTestId("hub-tab-b")).toHaveAttribute("aria-selected", "false");
  });

  it("calls onChange when a tab is clicked", () => {
    const onChange = jest.fn();
    render(
      <HubSegmentedControl value="a" onChange={onChange} options={OPTIONS} ariaLabel="Test tabs" />
    );

    fireEvent.click(screen.getByTestId("hub-tab-b"));
    expect(onChange).toHaveBeenCalledWith("b");
  });

  it("renders badge count when badge > 0", () => {
    render(
      <HubSegmentedControl value="b" onChange={() => {}} options={OPTIONS} ariaLabel="Test tabs" />
    );

    expect(screen.getByText("3")).toBeInTheDocument();
  });
});
