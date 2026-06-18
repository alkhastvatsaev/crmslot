"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { onAuthStateChanged } from "firebase/auth";
import { onSnapshot } from "firebase/firestore";
import { auth, firestore, isConfigured } from "@/core/config/firebase";
import { logger } from "@/core/logger";
import type { Intervention } from "@/features/interventions/types";
import { TECHNICIAN_ASSIGNMENTS_QUERY_KEY } from "@/features/offline/technicianQueryKeys";
import { buildTechnicianInterventionList } from "@/features/interventions/technicianAssignmentsFilter";
import { getTechnicianAssignmentUid } from "@/features/interventions/technicianAssignmentActions";
import {
  fetchTechnicianAssignments,
  TECHNICIAN_ASSIGNMENTS_POLL_MS,
  technicianAssignmentsFirestoreQuery,
} from "@/features/interventions/technicianAssignmentsQuery";
import { writeTerrainMissionsCache } from "@/features/offline/terrainMissionsCache";
import { TECHNICIAN_ASSIGNMENTS_RESYNC_EVENT } from "@/features/interventions/technicianAssignmentSyncEvents";
import {
  interventionAssignmentPreview,
  newAssignmentIdsFromSnapshotChanges,
  showTechnicianNewAssignmentNotification,
} from "@/features/interventions/technicianNewAssignmentAlerts";
import { toast } from "sonner";

export type UseTechnicianAssignmentsResult = {
  interventions: Intervention[];
  loading: boolean;
  error: string | null;
  firebaseUid: string | null;
};

type Options = {
  /** Désactiver l’écoute Firestore (ex. carte dispatch qui utilise le back-office). */
  enabled?: boolean;
};

function applyAssignmentsToCache(
  queryClient: ReturnType<typeof useQueryClient>,
  technicianUid: string,
  data: Intervention[]
) {
  queryClient.setQueryData([TECHNICIAN_ASSIGNMENTS_QUERY_KEY, technicianUid], data);
  writeTerrainMissionsCache(technicianUid, data);
}

/**
 * Temps réel — interventions visibles par le technicien **après** le goulot IVANA.
 * Resync serveur périodique : le listener Firestore peut ne pas pousser les nouvelles
 * assignations IVANA tant que l’app mobile reste ouverte (WebView / PWA).
 */
export function useTechnicianAssignments(options: Options = {}): UseTechnicianAssignmentsResult {
  const hookEnabled = options.enabled !== false;
  const queryClient = useQueryClient();

  const noFirebaseAuth = !isConfigured || !firestore || !auth;

  const [firebaseUid, setFirebaseUid] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [snapshotReady, setSnapshotReady] = useState(() => noFirebaseAuth);

  const [prevHookEnabled, setPrevHookEnabled] = useState(hookEnabled);
  if (prevHookEnabled !== hookEnabled) {
    setPrevHookEnabled(hookEnabled);
    if (!hookEnabled) {
      setFirebaseUid(null);
      setError(null);
    }
  }

  const assignmentsQueryKey = useMemo(
    () => [TECHNICIAN_ASSIGNMENTS_QUERY_KEY, firebaseUid] as const,
    [firebaseUid]
  );

  const assignmentsQuery = useQuery({
    queryKey: assignmentsQueryKey,
    enabled: Boolean(firebaseUid),
    staleTime: Infinity,
    gcTime: 1000 * 60 * 60 * 24 * 14,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
    queryFn: async () =>
      queryClient.getQueryData<Intervention[]>(assignmentsQueryKey as readonly unknown[]) ?? [],
  });

  const firestoreInterventions = useMemo(
    () => assignmentsQuery.data ?? [],
    [assignmentsQuery.data]
  );

  const interventions = useMemo(
    () =>
      buildTechnicianInterventionList({
        firestoreInterventions,
        technicianUid: firebaseUid,
      }),
    [firestoreInterventions, firebaseUid]
  );

  const loading = Boolean(
    isConfigured &&
    firestore &&
    auth &&
    firebaseUid &&
    !snapshotReady &&
    firestoreInterventions.length === 0 &&
    !error
  );

  const syncFromServerRef = useRef<(() => Promise<void>) | null>(null);
  const listenerHydratedRef = useRef(false);
  const knownAssignmentIdsRef = useRef<Set<string>>(new Set());

  const notifyNewAssignments = useCallback((rows: Intervention[]) => {
    if (rows.length === 0) return;
    const preview = interventionAssignmentPreview(rows[rows.length - 1]!);
    toast.message("Nouvelle intervention", {
      description: rows.length > 1 ? `${rows.length} nouvelles missions` : preview,
    });
    showTechnicianNewAssignmentNotification(
      "Nouvelle intervention",
      preview,
      `assignment-${rows[rows.length - 1]!.id}`
    );
  }, []);

  const syncAssignmentsFromServer = useCallback(async () => {
    const uid = firebaseUid?.trim();
    const db = firestore;
    if (!uid || !db || typeof document === "undefined") return;
    if (document.visibilityState !== "visible") return;

    try {
      const data = await fetchTechnicianAssignments(db, uid, { fromServer: true });
      const prev =
        queryClient.getQueryData<Intervention[]>([
          TECHNICIAN_ASSIGNMENTS_QUERY_KEY,
          uid,
        ] as const) ?? [];
      const prevIds = new Set(prev.map((row) => row.id));
      const added = data.filter((row) => !prevIds.has(row.id));
      if (listenerHydratedRef.current && added.length > 0) {
        notifyNewAssignments(added);
      }
      for (const row of data) {
        knownAssignmentIdsRef.current.add(row.id);
      }
      applyAssignmentsToCache(queryClient, uid, data);
      setSnapshotReady(true);
      setError(null);
    } catch (e) {
      logger.warn("[useTechnicianAssignments] resync", {
        error: e instanceof Error ? e.message : String(e),
      });
    }
  }, [firebaseUid, queryClient, notifyNewAssignments]);

  syncFromServerRef.current = syncAssignmentsFromServer;

  useEffect(() => {
    if (!hookEnabled || noFirebaseAuth) return () => {};

    let unsubSnap: (() => void) | undefined;

    const clearSnap = () => {
      const stop = unsubSnap;
      unsubSnap = undefined;
      if (!stop) return;
      if (typeof queueMicrotask === "function") {
        queueMicrotask(() => stop());
      } else {
        setTimeout(() => stop(), 0);
      }
    };

    const unsubAuth = onAuthStateChanged(auth!, (user) => {
      clearSnap();

      const technicianUid = getTechnicianAssignmentUid(user?.uid ?? null);

      queryClient.removeQueries({
        predicate: (q) =>
          Array.isArray(q.queryKey) &&
          q.queryKey[0] === TECHNICIAN_ASSIGNMENTS_QUERY_KEY &&
          q.queryKey[1] !== technicianUid,
      });

      if (!technicianUid) {
        setFirebaseUid(null);
        setError(null);
        setSnapshotReady(true);
        return;
      }

      setFirebaseUid(technicianUid);
      setSnapshotReady(false);
      setError(null);
      listenerHydratedRef.current = false;
      knownAssignmentIdsRef.current = new Set();

      const db = firestore!;
      const q = technicianAssignmentsFirestoreQuery(db, technicianUid);

      unsubSnap = onSnapshot(
        q,
        { includeMetadataChanges: false },
        (snapshot) => {
          const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as Intervention);

          if (!listenerHydratedRef.current) {
            listenerHydratedRef.current = true;
            knownAssignmentIdsRef.current = new Set(data.map((row) => row.id));
            applyAssignmentsToCache(queryClient, technicianUid, data);
            setSnapshotReady(true);
            setError(null);
            return;
          }

          const newIds = newAssignmentIdsFromSnapshotChanges(
            snapshot.docChanges().map((c) => ({ type: c.type, docId: c.doc.id })),
            knownAssignmentIdsRef.current
          );
          for (const id of data.map((row) => row.id)) {
            knownAssignmentIdsRef.current.add(id);
          }

          if (newIds.length > 0) {
            const addedRows = data.filter((row) => newIds.includes(row.id));
            notifyNewAssignments(addedRows);
            void syncFromServerRef.current?.();
          }

          applyAssignmentsToCache(queryClient, technicianUid, data);
          setSnapshotReady(true);
          setError(null);
        },
        (e) => {
          logger.error("[useTechnicianAssignments]", {
            error: e instanceof Error ? e.message : String(e),
          });
          setError(e.message || "Erreur Firestore");
          setSnapshotReady(true);
        }
      );

      void fetchTechnicianAssignments(db, technicianUid, { fromServer: true })
        .then((data) => {
          applyAssignmentsToCache(queryClient, technicianUid, data);
          setSnapshotReady(true);
          setError(null);
        })
        .catch((e) => {
          logger.warn("[useTechnicianAssignments] initial server pull", {
            error: e instanceof Error ? e.message : String(e),
          });
        });
    });

    return () => {
      clearSnap();
      unsubAuth();
    };
  }, [queryClient, hookEnabled, noFirebaseAuth, notifyNewAssignments]);

  useEffect(() => {
    if (!hookEnabled || !firebaseUid || noFirebaseAuth) return () => {};

    const onResync = () => {
      void syncFromServerRef.current?.();
    };
    window.addEventListener(TECHNICIAN_ASSIGNMENTS_RESYNC_EVENT, onResync);
    return () => window.removeEventListener(TECHNICIAN_ASSIGNMENTS_RESYNC_EVENT, onResync);
  }, [hookEnabled, firebaseUid, noFirebaseAuth]);

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
  }, [hookEnabled, firebaseUid, noFirebaseAuth]);

  /** Polling léger tant que l’écran terrain est visible (nouvelle assignation IVANA). */
  useEffect(() => {
    if (!hookEnabled || !firebaseUid || noFirebaseAuth || typeof window === "undefined") {
      return () => {};
    }

    const tick = () => {
      if (document.visibilityState === "visible") {
        void syncFromServerRef.current?.();
      }
    };

    const intervalId = window.setInterval(tick, TECHNICIAN_ASSIGNMENTS_POLL_MS);
    return () => window.clearInterval(intervalId);
  }, [hookEnabled, firebaseUid, noFirebaseAuth]);

  return { interventions, loading, error, firebaseUid };
}
