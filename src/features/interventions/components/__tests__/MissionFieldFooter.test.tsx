import { render, screen } from "@/test-utils/render";
import MissionFieldFooter from "@/features/interventions/components/MissionFieldFooter";
import type { Intervention } from "@/features/interventions/types";

function iv(
  status: Intervention["status"]
): Pick<Intervention, "status" | "clientPhone" | "phone" | "address" | "clientEmail"> {
  return { status, address: "Rue 1" };
}

describe("MissionFieldFooter", () => {
  it("hides finish button when hideAutomatedActions is enabled", () => {
    render(
      <MissionFieldFooter
        intervention={iv("in_progress")}
        hideAutomatedActions
        onPrimaryTransition={jest.fn()}
        onFinish={jest.fn()}
      />
    );

    expect(screen.queryByTestId("mission-action-primary-finish")).not.toBeInTheDocument();
    expect(screen.queryByTestId("mission-action-bar")).not.toBeInTheDocument();
  });

  it("shows finish button as camera icon only", () => {
    render(
      <MissionFieldFooter
        intervention={iv("in_progress")}
        onPrimaryTransition={jest.fn()}
        onFinish={jest.fn()}
      />
    );

    const finish = screen.getByTestId("mission-action-primary-finish");
    expect(finish).toBeInTheDocument();
    expect(finish).toHaveAttribute("aria-label");
    expect(finish).not.toHaveTextContent("Terminer");
  });

  it("hides depart slide when hideAutomatedActions is enabled on en_route", () => {
    render(
      <MissionFieldFooter
        intervention={iv("en_route")}
        hideAutomatedActions
        onPrimaryTransition={jest.fn()}
        onFinish={jest.fn()}
      />
    );

    expect(screen.queryByTestId("mission-action-primary-on-site")).not.toBeInTheDocument();
    expect(screen.queryByTestId("mission-action-bar")).not.toBeInTheDocument();
  });
});
