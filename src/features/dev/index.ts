/**
 * API publique dev — utilitaires développement (cleanup service worker).
 */
export { default as DevServiceWorkerCleanup } from "@/features/dev/DevServiceWorkerCleanup";
export {
  clearDevEnergyProbe,
  getDevEnergyActiveCount,
  getDevEnergyProbes,
  setDevEnergyProbe,
} from "@/features/dev/devEnergyMonitor";
export type { DevEnergyProbe, DevEnergyProbeCategory } from "@/features/dev/devEnergyMonitor";
