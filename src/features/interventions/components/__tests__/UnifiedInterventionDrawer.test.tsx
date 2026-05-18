import { render, screen, fireEvent } from "@/test-utils/render";
import UnifiedInterventionDrawer from "@/features/interventions/components/UnifiedInterventionDrawer";
import type { Intervention } from "@/features/interventions/types";

const baseIv: Intervention = {
  id: "iv-drawer",
  title: "Porte",
  address: "Bruxelles",
  time: "09:00",
  status: "in_progress",
  location: { lat: 50.8, lng: 4.35 },
  companyId: "co-1",
};

describe("UnifiedInterventionDrawer", () => {
  it("switches tabs", () => {
    render(
      <UnifiedInterventionDrawer
        intervention={baseIv}
        technicianUid="tech-1"
        allowMaterialCreate
      />,
    );
    expect(screen.getByTestId("unified-intervention-drawer")).toBeInTheDocument();
    fireEvent.click(screen.getByTestId("unified-drawer-tab-emails"));
    expect(screen.getByTestId("unified-drawer-panel-emails")).toBeInTheDocument();
  });
});
