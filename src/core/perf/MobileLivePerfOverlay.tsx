"use client";

import { useEffect, useState } from "react";
import {
  buildLivePerfProbeSnapshot,
  subscribeLivePerfProbe,
  type LivePerfProbeSnapshot,
} from "@/core/perf/livePerfProbeState";
import { disableLivePerfProbe } from "@/core/perf/isLivePerfProbeEnabled";

function Row({ label, value, hot }: { label: string; value: string | number; hot?: boolean }) {
  return (
    <div className="flex justify-between gap-3 text-[11px] leading-tight">
      <span className="text-white/60">{label}</span>
      <span className={hot ? "font-semibold text-amber-300" : "text-white/95"}>{value}</span>
    </div>
  );
}

/** Overlay diagnostic — activer via `?perf=1` sur l’URL (iPhone Safari). */
export default function MobileLivePerfOverlay() {
  const [snap, setSnap] = useState<LivePerfProbeSnapshot>(() => buildLivePerfProbeSnapshot());

  useEffect(() => subscribeLivePerfProbe(setSnap), []);

  const hot =
    snap.fps > 30 ||
    snap.activeIntervals > 3 ||
    snap.longTaskMsLast5s > 200 ||
    snap.mountedHubPages > 1;

  return (
    <div
      className="pointer-events-auto fixed bottom-2 left-2 right-2 z-[9999] max-h-[42dvh] overflow-y-auto rounded-xl border border-amber-500/40 bg-black/88 p-3 font-mono text-white shadow-2xl backdrop-blur-md"
      data-testid="live-perf-probe"
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-[12px] font-bold text-amber-300">PERF LIVE</p>
        <button
          type="button"
          className="rounded-md bg-white/10 px-2 py-0.5 text-[10px] text-white/80"
          onClick={() => {
            disableLivePerfProbe();
            window.location.reload();
          }}
        >
          OFF
        </button>
      </div>
      <Row label="FPS (sonde)" value={snap.fps} hot={snap.fps > 35} />
      <Row label="rAF / sec" value={snap.rafPerSec} hot={snap.rafPerSec > 40} />
      <Row label="setInterval actifs" value={snap.activeIntervals} hot={snap.activeIntervals > 3} />
      <Row
        label="Long tasks 5s"
        value={`${snap.longTasksLast5s} (${snap.longTaskMsLast5s}ms)`}
        hot={snap.longTaskMsLast5s > 200}
      />
      <Row
        label="Hubs montés / suspendus"
        value={`${snap.mountedHubPages} / ${snap.suspendedHubPages}`}
        hot={snap.mountedHubPages > 1}
      />
      <Row label="Onglet caché" value={snap.documentHidden ? "oui" : "non"} />
      <Row label="Service worker" value={snap.serviceWorkerActive ? "oui" : "non"} />
      <Row label="Réseau" value={snap.connectionType} />
      <Row label="Build" value={snap.gitSha.slice(0, 7)} />
      {hot ? (
        <p className="mt-2 text-[10px] leading-snug text-amber-200/90">
          Chauffe probable si FPS/rAF élevés, plusieurs hubs montés, ou long tasks fréquentes.
        </p>
      ) : null}
    </div>
  );
}
