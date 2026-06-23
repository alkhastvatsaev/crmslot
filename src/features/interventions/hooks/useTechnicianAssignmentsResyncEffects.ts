"use client";

import { useEffect, useState, type MutableRefObject } from "react";
import { resolveTechnicianAssignmentsPollMs } from "@/features/interventions/technicianAssignmentsQuery";
import { TECHNICIAN_ASSIGNMENTS_RESYNC_EVENT } from "@/features/interventions/technicianAssignmentSyncEvents";

type ResyncEffectsParams = {
  hookEnabled: boolean;
  firebaseUid: string | null;
  noFirebaseAuth: boolean;
  syncFromServerRef: MutableRefObject<(() => Promise<void>) | null>;
};

export function useTechnicianAssignmentsResyncEffects(params: ResyncEffectsParams): void {
  const { hookEnabled, firebaseUid, noFirebaseAuth, syncFromServerRef } = params;

  useEffect(() => {
    if (!hookEnabled || !firebaseUid || noFirebaseAuth) return () => {};

    const onResync = () => {
      void syncFromServerRef.current?.();
    };
    window.addEventListener(TECHNICIAN_ASSIGNMENTS_RESYNC_EVENT, onResync);
    return () => window.removeEventListener(TECHNICIAN_ASSIGNMENTS_RESYNC_EVENT, onResync);
  }, [hookEnabled, firebaseUid, noFirebaseAuth, syncFromServerRef]);

  /** Resync quand l’app revient au premier plan ou retrouve le réseau. */
  useEffect(() => {
    if (!hookEnabled || !firebaseUid || noFirebaseAuth) return () => {};

    const onVisible = () => {
      if (document.visibilityState === "visible") {
        void syncFromServerRef.current?.();
      }
    };
    const onOnline = () => {
      void syncFromServerRef.current?.();
    };

    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("online", onOnline);

    let unlistenCapacitor: (() => void) | null = null;
    let cancelled = false;

    void (async () => {
      try {
        const { isCapacitorNative } = await import("@/core/native/capacitorRuntime");
        if (!isCapacitorNative() || cancelled) return;
        const { App } = await import("@capacitor/app");
        if (cancelled) return;
        const handle = await App.addListener("appStateChange", ({ isActive }) => {
          if (isActive) void syncFromServerRef.current?.();
        });
        unlistenCapacitor = () => handle.remove();
      } catch {
        /* web pur */
      }
    })();

    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("online", onOnline);
      unlistenCapacitor?.();
    };
  }, [hookEnabled, firebaseUid, noFirebaseAuth, syncFromServerRef]);
}

export function useTechnicianAssignmentsPolling(params: ResyncEffectsParams): void {
  const { hookEnabled, firebaseUid, noFirebaseAuth, syncFromServerRef } = params;
  const [, setPollArmed] = useState(false);

  /** Polling léger tant que l’écran terrain est visible (nouvelle assignation IVANA). */
  useEffect(() => {
    if (!hookEnabled || !firebaseUid || noFirebaseAuth || typeof window === "undefined") {
      return () => {};
    }

    const pollMs = resolveTechnicianAssignmentsPollMs();
    let intervalId: number | null = null;

    const tick = () => {
      if (document.visibilityState === "visible") {
        void syncFromServerRef.current?.();
      }
    };

    const start = () => {
      if (intervalId || document.visibilityState !== "visible") return;
      tick();
      intervalId = window.setInterval(tick, pollMs);
      setPollArmed(true);
    };

    const stop = () => {
      if (!intervalId) return;
      window.clearInterval(intervalId);
      intervalId = null;
      setPollArmed(false);
    };

    const onVisibility = () => {
      if (document.visibilityState === "visible") start();
      else stop();
    };

    start();
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      stop();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [hookEnabled, firebaseUid, noFirebaseAuth, syncFromServerRef]);
}
