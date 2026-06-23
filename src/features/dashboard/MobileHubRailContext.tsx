"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { MobileHubRail } from "@/features/dashboard/dashboardMobileNav";

export type MobileHubRailRegistration = {
  rails: readonly MobileHubRail[];
  activeRail: MobileHubRail;
  visible: boolean;
  /** Bascule le rail actif (ex. clic mission → panneau carte). */
  requestRail: (rail: MobileHubRail) => void;
};

type MobileHubRailContextValue = {
  snapshot: MobileHubRailRegistration | null;
  setRegistration: (id: string, registration: MobileHubRailRegistration | null) => void;
  requestRail: (rail: MobileHubRail) => void;
};

const MobileHubRailContext = createContext<MobileHubRailContextValue | null>(null);

function pickVisibleRegistration(
  registrations: Map<string, MobileHubRailRegistration>
): MobileHubRailRegistration | null {
  for (const registration of registrations.values()) {
    if (registration.visible && registration.rails.length > 1) {
      return registration;
    }
  }
  return null;
}

export function MobileHubRailProvider({ children }: { children: ReactNode }) {
  const [registrations, setRegistrations] = useState<Map<string, MobileHubRailRegistration>>(
    () => new Map()
  );
  const registrationsRef = useRef(registrations);
  registrationsRef.current = registrations;

  const setRegistration = useCallback(
    (id: string, registration: MobileHubRailRegistration | null) => {
      setRegistrations((prev) => {
        const next = new Map(prev);
        if (registration === null) {
          next.delete(id);
        } else {
          next.set(id, registration);
        }
        return next;
      });
    },
    []
  );

  const requestRail = useCallback((rail: MobileHubRail) => {
    const registration = pickVisibleRegistration(registrationsRef.current);
    if (!registration?.visible || !registration.rails.includes(rail)) return;
    registration.requestRail(rail);
  }, []);

  const snapshot = useMemo(() => pickVisibleRegistration(registrations), [registrations]);

  const value = useMemo(
    () => ({ snapshot, setRegistration, requestRail }),
    [snapshot, setRegistration, requestRail]
  );

  return <MobileHubRailContext.Provider value={value}>{children}</MobileHubRailContext.Provider>;
}

export function useMobileHubRailRegistration() {
  const ctx = useContext(MobileHubRailContext);
  return ctx?.setRegistration ?? (() => {});
}

export function useMobileHubRailSnapshot() {
  const ctx = useContext(MobileHubRailContext);
  return ctx?.snapshot ?? null;
}

/** Ouvre un rail du hub mobile visible (carte, société, technicien…). */
export function useRequestMobileHubRail() {
  const ctx = useContext(MobileHubRailContext);
  return ctx?.requestRail ?? (() => {});
}
