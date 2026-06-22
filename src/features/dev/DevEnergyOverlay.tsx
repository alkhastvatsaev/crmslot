"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import {
  getDevEnergyActiveCount,
  getDevEnergyProbes,
  isDevEnergyOverlayEnabled,
  subscribeDevEnergyMonitor,
  type DevEnergyCategory,
  type DevEnergyProbe,
} from "@/features/dev/devEnergyMonitor";

const CATEGORY_LABEL: Record<DevEnergyCategory, string> = {
  webgl: "WebGL",
  gps: "GPS",
  poll: "Poll",
  firestore: "Firestore",
  audio: "Audio",
  animation: "Anim",
  network: "Réseau",
  other: "Autre",
};

function readMemoryMb(): string | null {
  const mem = (performance as Performance & { memory?: { usedJSHeapSize: number } }).memory;
  if (!mem?.usedJSHeapSize) return null;
  return `${(mem.usedJSHeapSize / 1024 / 1024).toFixed(1)} Mo`;
}

function FpsMeter() {
  const [fps, setFps] = useState(0);

  useEffect(() => {
    if (!isDevEnergyOverlayEnabled()) return;
    let frames = 0;
    let last = performance.now();
    let raf = 0;

    const tick = (now: number) => {
      frames += 1;
      if (now - last >= 1000) {
        setFps(frames);
        frames = 0;
        last = now;
      }
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const hot = fps >= 50;
  return (
    <span className={hot ? "text-red-400" : "text-emerald-400"}>
      {fps} FPS{hot ? " ⚠" : ""}
    </span>
  );
}

function ProbeRow({ probe }: { probe: DevEnergyProbe }) {
  return (
    <div
      className={`flex items-start justify-between gap-2 border-b border-white/10 py-1 text-[10px] leading-tight ${
        probe.active ? "text-white" : "text-white/35"
      }`}
    >
      <div className="min-w-0">
        <span className={probe.active ? "font-semibold text-amber-300" : ""}>{probe.label}</span>
        <span className="ml-1 text-white/40">[{CATEGORY_LABEL[probe.category]}]</span>
        {probe.detail ? <div className="truncate text-white/50">{probe.detail}</div> : null}
      </div>
      <span className="shrink-0 tabular-nums">{probe.active ? "ON" : "off"}</span>
    </div>
  );
}

/** Panneau flottant — sonde consommation (travaux perf, à retirer ensuite). */
export default function DevEnergyOverlay() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [probes, setProbes] = useState<DevEnergyProbe[]>([]);
  const [visibility, setVisibility] = useState("visible");
  const [memoryMb, setMemoryMb] = useState<string | null>(null);

  useEffect(() => {
    if (!isDevEnergyOverlayEnabled()) return;
    const sync = () => setProbes(getDevEnergyProbes());
    sync();
    return subscribeDevEnergyMonitor(sync);
  }, []);

  useEffect(() => {
    if (!isDevEnergyOverlayEnabled()) return;
    const syncVis = () => setVisibility(document.visibilityState);
    const memIv = window.setInterval(() => setMemoryMb(readMemoryMb()), 2000);
    syncVis();
    document.addEventListener("visibilitychange", syncVis);
    return () => {
      document.removeEventListener("visibilitychange", syncVis);
      window.clearInterval(memIv);
    };
  }, []);

  if (!isDevEnergyOverlayEnabled()) return null;

  const active = getDevEnergyActiveCount();
  const activeProbes = probes.filter((p) => p.active);

  return (
    <div
      className="pointer-events-auto fixed bottom-2 left-2 z-[99999] max-w-[min(100vw-1rem,22rem)] font-mono text-[11px] shadow-2xl"
      data-testid="dev-energy-overlay"
    >
      <div className="overflow-hidden rounded-xl border border-amber-500/40 bg-black/90 backdrop-blur-md">
        <button
          type="button"
          className="flex w-full items-center justify-between gap-2 bg-amber-500/20 px-3 py-2 text-left text-amber-200"
          onClick={() => setCollapsed((c) => !c)}
        >
          <span className="font-bold uppercase tracking-wider">⚡ Énergie DEV</span>
          <span className="tabular-nums">
            {active} actif{active === 1 ? "" : "s"}
          </span>
        </button>

        {!collapsed ? (
          <div className="max-h-[min(50vh,320px)] overflow-y-auto px-3 py-2 text-white/90">
            <div className="mb-2 space-y-0.5 border-b border-white/10 pb-2 text-[10px]">
              <div>
                <FpsMeter />
              </div>
              <div className="text-white/60">Route : {pathname || "—"}</div>
              <div className={visibility === "hidden" ? "text-emerald-400" : "text-amber-300"}>
                Onglet : {visibility}
              </div>
              {memoryMb ? <div className="text-white/60">JS heap : {memoryMb}</div> : null}
            </div>

            {activeProbes.length === 0 ? (
              <p className="py-2 text-[10px] text-white/50">Aucune sonde active — bon signe.</p>
            ) : (
              <>
                <p className="mb-1 text-[9px] font-bold uppercase tracking-widest text-red-400">
                  Charge active
                </p>
                {activeProbes.map((p) => (
                  <ProbeRow key={p.id} probe={p} />
                ))}
              </>
            )}

            {probes.length > activeProbes.length ? (
              <>
                <p className="mb-1 mt-2 text-[9px] font-bold uppercase tracking-widest text-white/30">
                  Inactif
                </p>
                {probes
                  .filter((p) => !p.active)
                  .map((p) => (
                    <ProbeRow key={p.id} probe={p} />
                  ))}
              </>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
