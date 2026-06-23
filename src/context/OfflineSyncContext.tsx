"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { toast } from "sonner";
import {
  flushCompletionQueue,
  getCompletionQueueLength,
  subscribeCompletionQueueChanged,
  type FlushCompletionReport,
} from "@/features/offline";
import { useIsMobile } from "@/features/dashboard";

export type OfflineSyncContextValue = {
  navigatorOnline: boolean;
  pendingCompletionCount: number;
  isSyncing: boolean;
  /** Dernier rapport de sync (conflits ignorés, échecs, succès). */
  lastFlushReport: FlushCompletionReport | null;
  flushNow: () => Promise<void>;
  refreshPendingCount: () => Promise<void>;
};

const OfflineSyncContext = createContext<OfflineSyncContextValue | null>(null);

export function OfflineSyncProvider({ children }: { children: ReactNode }) {
  const isMobile = useIsMobile();
  const [navigatorOnline, setNavigatorOnline] = useState(() =>
    typeof navigator !== "undefined" ? navigator.onLine : true
  );
  const [pendingCompletionCount, setPendingCompletionCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastFlushReport, setLastFlushReport] = useState<FlushCompletionReport | null>(null);

  const refreshPendingCount = useCallback(async () => {
    const n = await getCompletionQueueLength();
    setPendingCompletionCount(n);
  }, []);

  const runFlushWithToasts = useCallback(async () => {
    if (typeof window === "undefined" || !navigator.onLine) return;

    setIsSyncing(true);
    try {
      const report = await flushCompletionQueue();
      setLastFlushReport(report);
      if (report.skippedConflict > 0) {
        toast.message("Conflit résolu", {
          description:
            report.skippedConflict === 1
              ? "Une intervention était déjà terminée sur le serveur — votre copie locale n’a pas été réappliquée."
              : `${report.skippedConflict} interventions déjà terminées sur le serveur — données locales ignorées.`,
        });
      }
      if (report.failed > 0) {
        toast.warning("Synchronisation partielle", {
          description:
            (report.failed === 1
              ? "Une entrée n’a pas pu être envoyée. "
              : `${report.failed} entrées n’ont pas pu être envoyées. `) +
            (report.lastError ? `Détail : ${report.lastError}. ` : "") +
            "Elles restent en file et seront renvoyées automatiquement (ou reconnectez le réseau).",
        });
      }
      if (report.uploaded > 0) {
        toast.success("Synchronisation terminée", {
          description:
            report.uploaded === 1
              ? "1 intervention mise à jour."
              : `${report.uploaded} interventions mises à jour.`,
        });
      }
    } finally {
      setIsSyncing(false);
      await refreshPendingCount();
    }
  }, [refreshPendingCount]);

  const flushNow = useCallback(async () => {
    await runFlushWithToasts();
  }, [runFlushWithToasts]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refreshPendingCount();
  }, [refreshPendingCount]);

  useEffect(() => {
    return subscribeCompletionQueueChanged(() => {
      void refreshPendingCount();
    });
  }, [refreshPendingCount]);

  useEffect(() => {
    const syncOnline = () => {
      setNavigatorOnline(true);
      void runFlushWithToasts();
    };
    const syncOffline = () => setNavigatorOnline(false);

    if (typeof window === "undefined") return () => {};

    window.addEventListener("online", syncOnline);
    window.addEventListener("offline", syncOffline);
    return () => {
      window.removeEventListener("online", syncOnline);
      window.removeEventListener("offline", syncOffline);
    };
  }, [runFlushWithToasts]);

  useEffect(() => {
    if (typeof window === "undefined" || !navigator.onLine) return;

    let cancelled = false;
    void (async () => {
      const n = await getCompletionQueueLength();
      if (!cancelled && n > 0 && navigator.onLine) await runFlushWithToasts();
    })();

    return () => {
      cancelled = true;
    };
    // Bootstrap uniquement au montage : évite une boucle si la longueur de file ou les handlers change.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional once on mount
  }, []);

  /** Retry périodique desktop — mobile : flush uniquement online / visibility. */
  useEffect(() => {
    if (typeof window === "undefined" || isMobile === true) return;
    const intervalId = window.setInterval(() => {
      if (!navigator.onLine || document.hidden) return;
      void (async () => {
        const n = await getCompletionQueueLength();
        if (n > 0) await runFlushWithToasts();
      })();
    }, 60_000);
    return () => {
      window.clearInterval(intervalId);
    };
  }, [runFlushWithToasts, isMobile]);

  useEffect(() => {
    if (typeof window === "undefined" || isMobile !== true) return;
    const onVisible = () => {
      if (!document.hidden && navigator.onLine) {
        void (async () => {
          const n = await getCompletionQueueLength();
          if (n > 0) await runFlushWithToasts();
        })();
      }
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [isMobile, runFlushWithToasts]);

  /** Capacitor : flush quand l'app revient au premier plan (sortie de background). */
  useEffect(() => {
    if (typeof window === "undefined") return;
    let unlisten: (() => void) | null = null;
    let cancelled = false;

    void (async () => {
      try {
        const { isCapacitorNative } = await import("@/core/native/capacitorRuntime");
        if (!isCapacitorNative()) return;
        const { App } = await import("@capacitor/app");
        if (cancelled) return;
        const handle = await App.addListener("appStateChange", ({ isActive }) => {
          if (isActive && navigator.onLine) {
            void runFlushWithToasts();
          }
        });
        unlisten = () => handle.remove();
      } catch {
        /* Capacitor app plugin indisponible — ok en web pur. */
      }
    })();

    return () => {
      cancelled = true;
      unlisten?.();
    };
  }, [runFlushWithToasts]);

  const value = useMemo(
    () => ({
      navigatorOnline,
      pendingCompletionCount,
      isSyncing,
      lastFlushReport,
      flushNow,
      refreshPendingCount,
    }),
    [
      navigatorOnline,
      pendingCompletionCount,
      isSyncing,
      lastFlushReport,
      flushNow,
      refreshPendingCount,
    ]
  );

  return <OfflineSyncContext.Provider value={value}>{children}</OfflineSyncContext.Provider>;
}

export function useOfflineSync(): OfflineSyncContextValue {
  const ctx = useContext(OfflineSyncContext);
  if (!ctx) throw new Error("useOfflineSync doit être utilisé sous OfflineSyncProvider.");
  return ctx;
}

export function useOfflineSyncOptional(): OfflineSyncContextValue | null {
  return useContext(OfflineSyncContext);
}
