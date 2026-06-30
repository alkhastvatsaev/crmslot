import { render, type RenderOptions } from "@testing-library/react";
import type { ReactElement, ReactNode } from "react";
import { LayoutShellProvider } from "@/context/LayoutShellContext";
import { DashboardPagerProvider } from "@/features/dashboard";
import { I18nProvider } from "@/core/i18n/I18nContext";

type Options = Omit<RenderOptions, "wrapper"> & {
  /** Page visible au montage (ex. index du hub testé). */
  initialPageIndex?: number;
};

/**
 * Rend un composant sous `DashboardPagerProvider` (évite de dupliquer le boilerplate dans les tests).
 */
export function renderWithPager(ui: ReactElement, pageCount = 9, options?: Options) {
  const { initialPageIndex = 0, ...renderOptions } = options ?? {};
  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <I18nProvider>
        <DashboardPagerProvider pageCount={pageCount} initialPageIndex={initialPageIndex}>
          {children}
        </DashboardPagerProvider>
      </I18nProvider>
    );
  }
  return render(ui, { wrapper: Wrapper, ...renderOptions });
}

/** Pager + shell desktop — `AdaptiveTriplePanelLayout` rend la grille 3 colonnes. */
export function renderWithDesktopPager(ui: ReactElement, pageCount = 9, options?: Options) {
  const { initialPageIndex = 0, ...renderOptions } = options ?? {};
  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <I18nProvider>
        <LayoutShellProvider mode="desktop">
          <DashboardPagerProvider pageCount={pageCount} initialPageIndex={initialPageIndex}>
            {children}
          </DashboardPagerProvider>
        </LayoutShellProvider>
      </I18nProvider>
    );
  }
  return render(ui, { wrapper: Wrapper, ...renderOptions });
}
