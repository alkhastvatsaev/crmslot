"use client";

import { logger } from "@/core/logger";

import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { onAuthStateChanged } from "firebase/auth";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { auth, firestore, isConfigured } from "@/core/config/firebase";
import { DEMO_TECHNICIAN_UID, devUiPreviewEnabled } from "@/core/config/devUiPreview";
import type { Intervention } from "@/features/interventions/types";
import { TECHNICIAN_ASSIGNMENTS_QUERY_KEY } from "@/features/offline/technicianQueryKeys";
import { buildTechnicianInterventionList } from "@/features/interventions/technicianAssignmentsFilter";
import { getTechnicianAssignmentUid } from "@/features/interventions/technicianAssignmentActions";
import { writeTerrainMissionsCache } from "@/features/offline/terrainMissionsCache";

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

/**
 * Temps réel — interventions visibles par le technicien **après** le goulot IVANA.
 */
export function useTechnicianAssignments(options: Options = {}): UseTechnicianAssignmentsResult {
  const hookEnabled = options.enabled !== false;
  const queryClient = useQueryClient();

  const noFirebaseAuth = !isConfigured || !firestore || !auth;

  const [firebaseUid, setFirebaseUid] = useState<string | null>(() =>
    noFirebaseAuth && devUiPreviewEnabled ? getTechnicianAssignmentUid(DEMO_TECHNICIAN_UID) : null
  );
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

      const rawAuthUid =
        devUiPreviewEnabled && (!user || user.isAnonymous)
          ? DEMO_TECHNICIAN_UID
          : (user?.uid ?? null);
      const technicianUid = getTechnicianAssignmentUid(rawAuthUid);

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

      const db = firestore!;

      const q = query(
        collection(db, "interventions"),
        where("assignedTechnicianUid", "==", technicianUid)
      );

      unsubSnap = onSnapshot(
        q,
        { includeMetadataChanges: false },
        (snapshot) => {
          const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as Intervention);
          queryClient.setQueryData([TECHNICIAN_ASSIGNMENTS_QUERY_KEY, technicianUid], data);
          writeTerrainMissionsCache(technicianUid, data);
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
    });

    return () => {
      clearSnap();
      unsubAuth();
    };
  }, [queryClient, hookEnabled, noFirebaseAuth]);

  return { interventions, loading, error, firebaseUid };
}
