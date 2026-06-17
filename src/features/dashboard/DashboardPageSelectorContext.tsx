"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

export type DashboardOverlayView = "closed" | "pages" | "account";

type DashboardPageSelectorContextValue = {
  view: DashboardOverlayView;
  /** Overlay ouvert (navigation ou compte). */
  open: boolean;
  /** Bascule la grille de navigation (calendrier / horloge). */
  toggle: () => void;
  toggleAccount: () => void;
  openPages: () => void;
  openAccount: () => void;
  close: () => void;
};

const DashboardPageSelectorContext = createContext<DashboardPageSelectorContextValue | null>(null);

export function DashboardPageSelectorProvider({
  children,
  initialOpen = false,
  initialView = "closed",
}: {
  children: ReactNode;
  initialOpen?: boolean;
  initialView?: DashboardOverlayView;
}) {
  const [view, setView] = useState<DashboardOverlayView>(initialOpen ? "pages" : initialView);

  const openPages = useCallback(() => {
    setView("pages");
  }, []);

  const openAccount = useCallback(() => {
    setView("account");
  }, []);

  const close = useCallback(() => {
    setView("closed");
  }, []);

  const toggle = useCallback(() => {
    setView((prev) => (prev === "pages" ? "closed" : "pages"));
  }, []);

  const toggleAccount = useCallback(() => {
    setView((prev) => (prev === "account" ? "closed" : "account"));
  }, []);

  const value = useMemo(
    (): DashboardPageSelectorContextValue => ({
      view,
      open: view !== "closed",
      toggle,
      toggleAccount,
      openPages,
      openAccount,
      close,
    }),
    [view, toggle, toggleAccount, openPages, openAccount, close]
  );

  return (
    <DashboardPageSelectorContext.Provider value={value}>
      {children}
    </DashboardPageSelectorContext.Provider>
  );
}

export function useDashboardPageSelector(): DashboardPageSelectorContextValue {
  const ctx = useContext(DashboardPageSelectorContext);
  if (!ctx) {
    throw new Error("useDashboardPageSelector must be used within DashboardPageSelectorProvider");
  }
  return ctx;
}

export function useDashboardPageSelectorOptional(): DashboardPageSelectorContextValue | null {
  return useContext(DashboardPageSelectorContext);
}
