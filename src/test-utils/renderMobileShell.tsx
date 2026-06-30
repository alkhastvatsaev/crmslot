import type { ReactNode } from "react";
import type { RenderResult } from "@testing-library/react";
import { DateProvider } from "@/context/DateContext";
import { MobileGalaxyComposerOpenProvider } from "@/context/MobileGalaxyComposerOpenContext";
import { DashboardPageSelectorProvider } from "@/features/dashboard/DashboardPageSelectorContext";
import MobileShell from "@/features/dashboard/components/MobileShell";
import { DashboardPagerProvider } from "@/features/dashboard/dashboardPagerContext";
import { GalaxyLayerBridgeProvider } from "@/features/map/GalaxyLayerBridgeContext";
import { render } from "@/test-utils/render";

export type RenderMobileShellOptions = {
  initialPageIndex?: number;
  initialSelectorOpen?: boolean;
};

/**
 * Monte `MobileShell` avec la pile providers admin mobile (pager + sélecteur + galaxy).
 * Les mocks (`useCrmStaffAccountPanel`, `useMobileFooterGalaxyVisible`, etc.) restent dans chaque fichier test.
 */
export function renderMobileShell(
  pages: ReactNode[],
  options: boolean | RenderMobileShellOptions = {}
): RenderResult {
  const resolved = typeof options === "boolean" ? { initialSelectorOpen: options } : options;
  const initialPageIndex = resolved.initialPageIndex ?? 0;
  const initialSelectorOpen = resolved.initialSelectorOpen ?? false;

  return render(
    <DateProvider>
      <GalaxyLayerBridgeProvider>
        <MobileGalaxyComposerOpenProvider>
          <DashboardPagerProvider pageCount={pages.length} initialPageIndex={initialPageIndex}>
            <DashboardPageSelectorProvider initialOpen={initialSelectorOpen}>
              <MobileShell pages={pages} />
            </DashboardPageSelectorProvider>
          </DashboardPagerProvider>
        </MobileGalaxyComposerOpenProvider>
      </GalaxyLayerBridgeProvider>
    </DateProvider>
  );
}
