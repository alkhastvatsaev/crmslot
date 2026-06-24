"use client";

import { useEffect } from "react";
import { isCapacitorNative } from "@/core/native/capacitorRuntime";

/** Rafraîchit le jeton FCM quand l’app revient au premier plan (PWA ou Capacitor). */
export function usePushTokenResyncOnResume(
  resync: () => void | Promise<void>,
  enabled = true
): void {
  useEffect(() => {
    if (!enabled || typeof document === "undefined") return;

    const run = () => {
      if (document.visibilityState !== "visible") return;
      void resync();
    };

    document.addEventListener("visibilitychange", run);

    let removeAppListener: (() => void) | undefined;
    if (isCapacitorNative()) {
      void import("@capacitor/app")
        .then(({ App }) =>
          App.addListener("appStateChange", ({ isActive }) => {
            if (isActive) void resync();
          })
        )
        .then((handle) => {
          removeAppListener = () => {
            void handle.remove();
          };
        })
        .catch(() => undefined);
    }

    return () => {
      document.removeEventListener("visibilitychange", run);
      removeAppListener?.();
    };
  }, [enabled, resync]);
}
