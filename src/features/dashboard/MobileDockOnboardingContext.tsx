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
const STORAGE_SWIPE_RIGHT_DONE = "crmslot_mobile_dock_hint_swipe_right_done";
const STORAGE_SWIPE_LEFT_DONE = "crmslot_mobile_dock_hint_swipe_left_done";

type MobileDockOnboardingContextValue = {
  headerHintActive: boolean;
  footerHintActive: boolean;
  swipeRightHintActive: boolean;
  swipeLeftHintActive: boolean;
  dismissHeaderHint: () => void;
  dismissFooterHint: () => void;
  dismissSwipeRightHint: () => void;
  dismissSwipeLeftHint: () => void;
};

const MobileDockOnboardingContext = createContext<MobileDockOnboardingContextValue | null>(null);

function readStoredFlag(key: string): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(key) === "1";
}

export function MobileDockOnboardingProvider({ children }: { children: ReactNode }) {
  const [headerDone, setHeaderDone] = useState(false);
  const [footerDone, setFooterDone] = useState(false);
  const [swipeRightDone, setSwipeRightDone] = useState(false);
  const [swipeLeftDone, setSwipeLeftDone] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHeaderDone(readStoredFlag(STORAGE_HEADER_DONE));
    setFooterDone(readStoredFlag(STORAGE_FOOTER_DONE));
    setSwipeRightDone(readStoredFlag(STORAGE_SWIPE_RIGHT_DONE));
    setSwipeLeftDone(readStoredFlag(STORAGE_SWIPE_LEFT_DONE));
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

  const dismissSwipeRightHint = useCallback(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_SWIPE_RIGHT_DONE, "1");
    }
    setSwipeRightDone(true);
  }, []);

  const dismissSwipeLeftHint = useCallback(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_SWIPE_LEFT_DONE, "1");
    }
    setSwipeLeftDone(true);
  }, []);

  const value = useMemo(
    () => ({
      headerHintActive: hydrated && !headerDone,
      footerHintActive: hydrated && headerDone && !footerDone,
      swipeRightHintActive: hydrated && footerDone && !swipeRightDone,
      swipeLeftHintActive: hydrated && footerDone && swipeRightDone && !swipeLeftDone,
      dismissHeaderHint,
      dismissFooterHint,
      dismissSwipeRightHint,
      dismissSwipeLeftHint,
    }),
    [
      hydrated,
      headerDone,
      footerDone,
      swipeRightDone,
      swipeLeftDone,
      dismissHeaderHint,
      dismissFooterHint,
      dismissSwipeRightHint,
      dismissSwipeLeftHint,
    ]
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
