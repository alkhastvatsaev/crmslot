"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

const STORAGE_HEADER_DONE = "crmslot_mobile_dock_hint_header_done";
const STORAGE_FOOTER_DONE = "crmslot_mobile_dock_hint_footer_done";

type MobileDockOnboardingContextValue = {
  headerHintActive: boolean;
  footerHintActive: boolean;
  dismissHeaderHint: () => void;
  dismissFooterHint: () => void;
};

const MobileDockOnboardingContext = createContext<MobileDockOnboardingContextValue | null>(null);

function readStoredFlag(key: string): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(key) === "1";
}

export function MobileDockOnboardingProvider({ children }: { children: ReactNode }) {
  const [headerDone, setHeaderDone] = useState(false);
  const [footerDone, setFooterDone] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHeaderDone(readStoredFlag(STORAGE_HEADER_DONE));
    setFooterDone(readStoredFlag(STORAGE_FOOTER_DONE));
    setHydrated(true);
  }, []);

  const dismissHeaderHint = useCallback(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_HEADER_DONE, "1");
    }
    setHeaderDone(true);
  }, []);

  const dismissFooterHint = useCallback(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_FOOTER_DONE, "1");
    }
    setFooterDone(true);
  }, []);

  const value = useMemo(
    () => ({
      headerHintActive: hydrated && !headerDone,
      footerHintActive: hydrated && headerDone && !footerDone,
      dismissHeaderHint,
      dismissFooterHint,
    }),
    [hydrated, headerDone, footerDone, dismissHeaderHint, dismissFooterHint]
  );

  return (
    <MobileDockOnboardingContext.Provider value={value}>
      {children}
    </MobileDockOnboardingContext.Provider>
  );
}

export function useMobileDockOnboarding(): MobileDockOnboardingContextValue {
  const ctx = useContext(MobileDockOnboardingContext);
  if (!ctx) {
    throw new Error("MobileDockOnboardingProvider manquant.");
  }
  return ctx;
}

export function useMobileDockOnboardingOptional(): MobileDockOnboardingContextValue | null {
  return useContext(MobileDockOnboardingContext);
}

export function useMobileShellDockHintAttrs(): Record<string, string | undefined> {
  const ctx = useMobileDockOnboardingOptional();
  return {
    "data-mobile-dock-hint-header": ctx?.headerHintActive ? "active" : undefined,
    "data-mobile-dock-hint-footer": ctx?.footerHintActive ? "active" : undefined,
  };
}
