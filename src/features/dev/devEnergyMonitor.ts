export type DevEnergyProbeCategory = "poll" | "webgl" | "audio" | "other";

export type DevEnergyProbe = {
  label: string;
  category: DevEnergyProbeCategory | string;
  active: boolean;
};

const probes = new Map<string, DevEnergyProbe>();

function overlayEnabled(): boolean {
  return process.env.NEXT_PUBLIC_DEV_ENERGY_OVERLAY === "true";
}

export function setDevEnergyProbe(id: string, probe: DevEnergyProbe): void {
  if (!overlayEnabled()) return;
  probes.set(id, probe);
}

export function clearDevEnergyProbe(id: string): void {
  probes.delete(id);
}

export function getDevEnergyProbes(): Array<DevEnergyProbe & { id: string }> {
  const rows = [...probes.entries()].map(([id, probe]) => ({ id, ...probe }));
  rows.sort((a, b) => Number(b.active) - Number(a.active));
  return rows;
}

export function getDevEnergyActiveCount(): number {
  return getDevEnergyProbes().filter((row) => row.active).length;
}
