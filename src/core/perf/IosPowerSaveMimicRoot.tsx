"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { installIosPowerSaveMimic } from "@/core/perf/installIosPowerSaveMimic";
import { resolveIosPowerSaveMimicFps } from "@/core/perf/iosPowerSaveMimicPolicy";

const IosPowerSaveMimicBanner = dynamic(() => import("@/core/perf/IosPowerSaveMimicBanner"), {
  ssr: false,
});

/** Bandeau si mimic actif (l’install rAF est faite en beforeInteractive). */
export default function IosPowerSaveMimicRoot() {
  const [fps, setFps] = useState<number | null>(null);

  useEffect(() => {
    const target = resolveIosPowerSaveMimicFps();
    if (target == null) return;
    if (!window.__crmslotLpmMimic) installIosPowerSaveMimic(target);
    setFps(target);
  }, []);

  if (fps == null) return null;
  return <IosPowerSaveMimicBanner fps={fps} />;
}

declare global {
  interface Window {
    __crmslotLpmMimic?: boolean;
  }
}
