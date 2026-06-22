/** Registre temporaire — overlay diagnostic consommation (travaux perf). */

export type DevEnergyCategory =
  | "webgl"
  | "gps"
  | "poll"
  | "firestore"
  | "audio"
  | "animation"
  | "network"
  | "other";

export type DevEnergyProbe = {
  id: string;
  label: string;
  category: DevEnergyCategory;
  active: boolean;
  detail?: string;
  updatedAt: number;
};

const probes = new Map<string, DevEnergyProbe>();
const listeners = new Set<() => void>();

export function isDevEnergyOverlayEnabled(): boolean {
  if (typeof window === "undefined") return false;
  return process.env.NEXT_PUBLIC_DEV_ENERGY_OVERLAY === "true";
}

function notify() {
  for (const fn of listeners) {
    try {
      fn();
    } catch {
      /* ignore */
    }
  }
}

export function subscribeDevEnergyMonitor(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function setDevEnergyProbe(
  id: string,
  patch: {
    label: string;
    category: DevEnergyCategory;
    active: boolean;
    detail?: string;
  }
): void {
  if (!isDevEnergyOverlayEnabled()) return;
  probes.set(id, { id, ...patch, updatedAt: Date.now() });
  notify();
}

export function clearDevEnergyProbe(id: string): void {
  if (!probes.has(id)) return;
  probes.delete(id);
  notify();
}

export function getDevEnergyProbes(): DevEnergyProbe[] {
  return [...probes.values()].sort((a, b) => {
    if (a.active !== b.active) return a.active ? -1 : 1;
    return a.label.localeCompare(b.label, "fr");
  });
}

export function getDevEnergyActiveCount(): number {
  let n = 0;
  for (const p of probes.values()) if (p.active) n += 1;
  return n;
}
