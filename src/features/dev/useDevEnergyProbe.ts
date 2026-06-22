"use client";

import { useEffect } from "react";
import {
  clearDevEnergyProbe,
  isDevEnergyOverlayEnabled,
  setDevEnergyProbe,
  type DevEnergyCategory,
} from "@/features/dev/devEnergyMonitor";

/** Enregistre une sonde tant que le composant est monté (overlay DEV uniquement). */
export function useDevEnergyProbe(
  id: string,
  label: string,
  category: DevEnergyCategory,
  active: boolean,
  detail?: string
): void {
  useEffect(() => {
    if (!isDevEnergyOverlayEnabled()) return () => {};
    setDevEnergyProbe(id, { label, category, active, detail });
    return () => clearDevEnergyProbe(id);
  }, [id, label, category, active, detail]);
}
