import fs from "node:fs";
import path from "node:path";
import type { ReactNode } from "react";
import { render, screen, fireEvent } from "@/test-utils/render";
import MobileShell from "@/features/dashboard/components/MobileShell";
import MobileScreenHost from "@/features/dashboard/components/MobileScreenHost";
import { DateProvider } from "@/context/DateContext";
import { DashboardPagerProvider } from "@/features/dashboard/dashboardPagerContext";
import { DashboardPageSelectorProvider } from "@/features/dashboard/DashboardPageSelectorContext";
import { MOBILE_SHELL_CONTRACT } from "@/features/dashboard/mobileShellContract";
import {
  MOBILE_GALAXY_DOCK_CHROME_CLASS,
  MOBILE_PROFILE_BAR_CHROME_CLASS,
  MOBILE_SHELL_SLOT_GRID_CLASS,
} from "@/core/ui/dashboardMobileLayout";

jest.mock("@/features/map/components/DashboardGalaxyLayer", () => ({
  __esModule: true,
  default: () => <div data-testid="galaxy-layer" />,
}));

const repoRoot = path.resolve(__dirname, "../../../../");

function renderMobileShell(pages: ReactNode[], initialOpen = false) {
  return render(
    <DateProvider>
      <DashboardPagerProvider pageCount={pages.length}>
        <DashboardPageSelectorProvider initialOpen={initialOpen}>
          <MobileShell pages={pages} />
        </DashboardPageSelectorProvider>
      </DashboardPagerProvider>
    </DateProvider>
  );
}

describe("mobileShellContract — source guards", () => {
  it.each(Object.entries(MOBILE_SHELL_CONTRACT.guardedSourceSnippets))(
    "preserve les invariants dans %s",
    (relativePath, snippets) => {
      const absolutePath = path.join(repoRoot, relativePath);
      const source = fs.readFileSync(absolutePath, "utf8");
      for (const snippet of snippets) {
        expect(source).toContain(snippet);
      }
    }
  );
});

describe("mobileShellContract — layout", () => {
  it("aligne profil et galaxy sur la même grille slot", () => {
    renderMobileShell([<div key="0">Map</div>]);

    expect(screen.getByTestId(MOBILE_SHELL_CONTRACT.testIds.topBar)).toHaveClass(
      MOBILE_SHELL_SLOT_GRID_CLASS
    );
    expect(screen.getByTestId(MOBILE_SHELL_CONTRACT.testIds.galaxyDock)).toHaveClass(
      MOBILE_SHELL_SLOT_GRID_CLASS
    );
    expect(
      screen
        .getByTestId(MOBILE_SHELL_CONTRACT.testIds.topBar)
        .querySelector(`.${MOBILE_PROFILE_BAR_CHROME_CLASS}`)
    ).toBeTruthy();
    expect(
      screen
        .getByTestId(MOBILE_SHELL_CONTRACT.testIds.galaxyDock)
        .querySelector(`.${MOBILE_GALAXY_DOCK_CHROME_CLASS}`)
    ).toBeTruthy();
  });

  it("expose le chip profil avec la classe contrat", () => {
    renderMobileShell([<div key="0">Map</div>]);
    expect(screen.getByTestId(MOBILE_SHELL_CONTRACT.testIds.profileToggle)).toHaveClass(
      MOBILE_SHELL_CONTRACT.layout.profileChipClass
    );
  });
});

describe("mobileShellContract — navigation profil", () => {
  it("ouvre le sélecteur dans le panneau central au clic profil", () => {
    renderMobileShell([<div key="0">Map</div>, <div key="1">Hub</div>, <div key="2">Tech</div>]);

    fireEvent.click(screen.getByTestId(MOBILE_SHELL_CONTRACT.testIds.profileToggle));

    expect(screen.getByTestId(MOBILE_SHELL_CONTRACT.testIds.pageSelectorHost)).toBeInTheDocument();
    expect(screen.getByTestId("dashboard-page-selector-layout")).toHaveClass("mobile-hub-layout");
    expect(screen.getByTestId(MOBILE_SHELL_CONTRACT.testIds.pageSelector)).toHaveClass(
      "mobile-hub-panel"
    );
    expect(screen.getByText("Map").closest("[aria-hidden='true']")).toBeTruthy();
  });

  it("navigue et ferme le sélecteur", () => {
    renderMobileShell([<div key="0">Map</div>, <div key="1">Material</div>]);

    fireEvent.click(screen.getByTestId(MOBILE_SHELL_CONTRACT.testIds.profileToggle));
    fireEvent.click(screen.getByTestId("dashboard-page-selector-item-1"));

    expect(
      screen.queryByTestId(MOBILE_SHELL_CONTRACT.testIds.pageSelector)
    ).not.toBeInTheDocument();
    expect(screen.getByTestId("mobile-page-1")).toBeInTheDocument();
  });
});

describe("mobileShellContract — MobileScreenHost", () => {
  it("exige DashboardPageSelectorProvider", () => {
    expect(() =>
      render(
        <DashboardPagerProvider pageCount={1}>
          <MobileScreenHost pages={[<div key="0">Map</div>]} />
        </DashboardPagerProvider>
      )
    ).toThrow(/DashboardPageSelectorProvider/);
  });

  it("garde toutes les pages montées quand le sélecteur est ouvert", () => {
    renderMobileShell([<div key="0">Map</div>, <div key="1">Hub</div>], true);

    expect(screen.getByText("Map")).toBeInTheDocument();
    expect(screen.getByText("Hub")).toBeInTheDocument();
    expect(screen.getByTestId(MOBILE_SHELL_CONTRACT.testIds.mapPage)).toHaveAttribute(
      "aria-hidden",
      "true"
    );
    expect(screen.getByTestId(MOBILE_SHELL_CONTRACT.testIds.pageSelector)).toBeInTheDocument();
  });
});
