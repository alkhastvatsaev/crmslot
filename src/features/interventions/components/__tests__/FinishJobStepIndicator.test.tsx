import { render, screen } from "@/test-utils/render";
import FinishJobStepIndicator from "@/features/interventions/components/FinishJobStepIndicator";

describe("FinishJobStepIndicator", () => {
  it("marks signature step active after photos", () => {
    render(<FinishJobStepIndicator current="signature" />);
    expect(screen.getByTestId("finish-step-signature")).toHaveAttribute("data-active", "true");
    expect(screen.getByTestId("finish-step-photos")).toHaveAttribute("data-done", "true");
  });
});
