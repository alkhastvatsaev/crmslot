"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { isLivePerfProbeEnabled } from "@/core/perf/isLivePerfProbeEnabled";
import { installLivePerfProbe } from "@/core/perf/livePerfProbeState";

const MobileLivePerfOverlay = dynamic(() => import("@/core/perf/MobileLivePerfOverlay"), {
  ssr: false,
});

export default function LivePerfProbeRoot() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    if (!isLivePerfProbeEnabled()) return;
    installLivePerfProbe();
    setEnabled(true);
  }, []);

  if (!enabled) return null;
  return <MobileLivePerfOverlay />;
}
