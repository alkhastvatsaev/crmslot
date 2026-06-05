import { render, screen } from "@/test-utils/render";
import { Phone } from "lucide-react";
import MissionContactRail from "@/features/interventions/components/MissionContactRail";

describe("MissionContactRail", () => {
  it("renders contact links with labels", () => {
    render(
      <MissionContactRail
        actions={[
          {
            key: "call",
            label: "Appeler",
            testId: "mission-action-call",
            href: "tel:+3212345678",
            tone: "call",
            icon: <Phone />,
          },
        ]}
      />,
    );

    expect(screen.getByTestId("mission-contact-rail")).toBeInTheDocument();
    expect(screen.getByTestId("mission-action-call")).toHaveAttribute("href", "tel:+3212345678");
    expect(screen.getByText("Appeler")).toBeInTheDocument();
  });
});
