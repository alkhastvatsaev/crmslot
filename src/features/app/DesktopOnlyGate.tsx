"use client";

import React, { useEffect, useState } from "react";
import { isPhoneUserAgent } from "@/core/config/mobileClientDetection";
import { mobileAccessAllowed } from "@/core/config/mobileAccess";
import { isCapacitorNative } from "@/core/native/capacitorRuntime";
import { fetchMobileRuntimeConfig } from "@/features/mobile/fetchMobileRuntimeConfig";
import {
  resolveRuntimeMobileAccessAllowed,
  shouldBypassDesktopOnlyGate,
} from "@/features/mobile/server/desktopOnlyGatePolicy";

/** Détection PWA / navigateur sur téléphone (Android, iPhone, iPod). iPad exclu pour usage tablette large. */
export function isPhoneClassDevice(): boolean {
  if (typeof window === "undefined") return false;
  return isPhoneUserAgent(navigator.userAgent);
}

type GatePhase = "bypass" | "pending" | "allowed" | "blocked";

function initialGatePhase(buildBypass: boolean): GatePhase {
  return buildBypass ? "bypass" : "pending";
}

export default function DesktopOnlyGate({ children }: { children: React.ReactNode }) {
  const buildBypass = shouldBypassDesktopOnlyGate(mobileAccessAllowed);
  const [phase, setPhase] = useState<GatePhase>(() => initialGatePhase(buildBypass));

  useEffect(() => {
    if (buildBypass) return;

    if (isCapacitorNative()) {
      setPhase("allowed");
      return;
    }

    let cancelled = false;

    void (async () => {
      if (!isPhoneClassDevice()) {
        if (!cancelled) setPhase("allowed");
        return;
      }

      const runtimeAllowed = await resolveRuntimeMobileAccessAllowed(fetchMobileRuntimeConfig);
      if (cancelled) return;
      setPhase(runtimeAllowed ? "allowed" : "blocked");
    })();

    return () => {
      cancelled = true;
    };
  }, [buildBypass]);

  if (phase === "bypass" || phase === "allowed") {
    return <>{children}</>;
  }

  if (phase === "pending") {
    return (
      <div
        data-testid="desktop-only-gate-loading"
        className="flex h-dvh items-center justify-center overflow-hidden bg-slate-50"
      >
        <div
          className="h-9 w-9 animate-spin rounded-full border-2 border-slate-200 border-t-slate-600"
          aria-hidden
        />
      </div>
    );
  }

  return (
    <div
      data-testid="desktop-only-gate-blocked"
      className="flex h-dvh flex-col items-center justify-center gap-3 overflow-hidden bg-slate-50 px-6 text-center"
    >
      <p className="text-lg font-semibold text-slate-800">Version desktop uniquement</p>
      <p className="max-w-md text-sm leading-relaxed text-slate-600">
        Cette version est optimisée pour ordinateur et tablette. Pour tester sur téléphone en
        staging, définissez <code className="text-xs">NEXT_PUBLIC_ALLOW_MOBILE=true</code>.
      </p>
    </div>
  );
}
