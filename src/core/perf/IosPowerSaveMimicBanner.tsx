"use client";

import { disableIosPowerSaveMimic } from "@/core/perf/iosPowerSaveMimicPolicy";

type Props = { fps: number };

/** Bandeau discret — mimic LPM actif (test chauffe / batterie). */
export default function IosPowerSaveMimicBanner({ fps }: Props) {
  return (
    <div
      className="pointer-events-auto fixed left-2 right-2 top-[max(0.5rem,env(safe-area-inset-top))] z-[9998] flex items-center justify-between gap-2 rounded-lg border border-emerald-500/35 bg-black/85 px-3 py-2 font-mono text-[11px] text-emerald-100 shadow-lg backdrop-blur-md"
      data-testid="ios-lpm-mimic-banner"
    >
      <span>
        Mimic éco iOS · rAF ~{fps} fps — visuel inchangé, throttle JS comme Low Power Mode
      </span>
      <button
        type="button"
        className="shrink-0 rounded-md bg-white/10 px-2 py-0.5 text-white/80"
        onClick={() => {
          disableIosPowerSaveMimic();
          window.location.reload();
        }}
      >
        OFF
      </button>
    </div>
  );
}
