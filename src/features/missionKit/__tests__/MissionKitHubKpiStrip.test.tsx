import { render, screen } from "@testing-library/react";
import { I18nProvider } from "@/core/i18n/I18nContext";
import MissionKitHubKpiStrip from "@/features/missionKit/components/MissionKitHubKpiStrip";

describe("MissionKitHubKpiStrip", () => {
  it("affiche les KPI kit et waiting_material", () => {
    render(
      <I18nProvider>
        <MissionKitHubKpiStrip
          metrics={{
            evaluated30d: 10,
            complete30d: 7,
            completePct30d: 70,
            waitingMaterialJobs: 2,
          }}
        />
      </I18nProvider>
    );
    expect(screen.getByTestId("mission-kit-hub-kpi")).toBeInTheDocument();
    expect(screen.getByTestId("mission-kit-kpi-complete-pct")).toHaveTextContent("70%");
    expect(screen.getByTestId("mission-kit-kpi-waiting")).toHaveTextContent("2");
  });
});
