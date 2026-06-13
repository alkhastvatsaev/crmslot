"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

type DashboardPageSelectorContextValue = {
  open: boolean;
  toggle: () => void;
  close: () => void;
};

const DashboardPageSelectorContext = createContext<DashboardPageSelectorContextValue | null>(null);

export function DashboardPageSelectorProvider({
  children,
  initialOpen = false,
}: {
  children: ReactNode;
  initialOpen?: boolean;
}) {
  const [open, setOpen] = useState(initialOpen);

  const toggle = useCallback(() => {
    setOpen((prev) => !prev);
  }, []);

  const close = useCallback(() => {
    setOpen(false);
  }, []);

  const value = useMemo(
    () => ({
      open,
      toggle,
      close,
    }),
    [open, toggle, close]
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
