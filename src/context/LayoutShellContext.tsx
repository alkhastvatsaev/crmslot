"use client";

import { createContext, useContext, type ReactNode } from "react";

export type LayoutShellMode = "mobile" | "desktop";

const LayoutShellContext = createContext<LayoutShellMode>("desktop");

/** Shell actif (mobile vs desktop) — source de vérité pour les layouts hub. */
export function LayoutShellProvider({
  mode,
  children,
}: {
  mode: LayoutShellMode;
  children: ReactNode;
}) {
  return <LayoutShellContext.Provider value={mode}>{children}</LayoutShellContext.Provider>;
}

export function useLayoutShellMode(): LayoutShellMode {
  return useContext(LayoutShellContext);
}

/** Vrai dans `MobileShell` — indépendant des micro-variations de `useIsMobile()`. */
export function useMobileHubLayout(): boolean {
  return useLayoutShellMode() === "mobile";
}
