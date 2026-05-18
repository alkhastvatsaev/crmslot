import { render, screen } from "@/test-utils/render";
import FinishJobStepIndicator from "@/features/interventions/components/FinishJobStepIndicator";

describe("FinishJobStepIndicator", () => {
  it("marks billing step active", () => {
    render(<FinishJobStepIndicator current="billing" />);
    expect(screen.getByTestId("finish-step-billing")).toHaveAttribute("data-active", "true");
    expect(screen.getByTestId("finish-step-photos")).toHaveAttribute("data-done", "true");
  });
});
