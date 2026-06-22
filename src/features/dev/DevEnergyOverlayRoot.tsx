"use client";

import dynamic from "next/dynamic";
import { isDevEnergyOverlayEnabled } from "@/features/dev/devEnergyMonitor";

const DevEnergyOverlay = dynamic(() => import("@/features/dev/DevEnergyOverlay"), { ssr: false });

/** Monté dans layout racine si NEXT_PUBLIC_DEV_ENERGY_OVERLAY=true */
export default function DevEnergyOverlayRoot() {
  if (!isDevEnergyOverlayEnabled()) return null;
  return <DevEnergyOverlay />;
}
