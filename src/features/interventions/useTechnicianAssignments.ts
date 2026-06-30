"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { auth, firestore, isConfigured } from "@/core/config/firebase";
import type { Intervention } from "@/features/interventions/types";
import { TECHNICIAN_ASSIGNMENTS_QUERY_KEY } from "@/features/offline/technicianQueryKeys";
import { buildTechnicianInterventionList } from "@/features/interventions/technicianAssignmentsFilter";
import { useTechnicianAssignmentsFirestoreListener } from "@/features/interventions/hooks/useTechnicianAssignmentsFirestoreListener";
import {
  useTechnicianAssignmentsPolling,
  useTechnicianAssignmentsResyncEffects,
} from "@/features/interventions/hooks/useTechnicianAssignmentsResyncEffects";
import { syncTechnicianAssignmentsFromServer } from "@/features/interventions/technicianAssignmentsSync";
import type {
  UseTechnicianAssignmentsOptions,
  UseTechnicianAssignmentsResult,
} from "@/features/interventions/useTechnicianAssignmentsTypes";

export type { UseTechnicianAssignmentsResult } from "@/features/interventions/useTechnicianAssignmentsTypes";

/**
 * Temps réel — interventions visibles par le technicien **après** validation dispatch.
 * Resync serveur périodique : le listener Firestore peut ne pas pousser les nouvelles
 * assignations tant que l’app mobile reste ouverte (WebView / PWA).
 */
export function useTechnicianAssignments(
  options: UseTechnicianAssignmentsOptions = {}
): UseTechnicianAssignmentsResult {
  const hookEnabled = options.enabled !== false;
  const pollingEnabled = options.pollingEnabled !== false && hookEnabled;
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

  const syncAssignmentsFromServer = useCallback(async () => {
    const uid = firebaseUid?.trim();
    const db = firestore;
    if (!uid || !db) return;

    await syncTechnicianAssignmentsFromServer({
      db,
      uid,
      queryClient,
      listenerHydratedRef,
      knownAssignmentIdsRef,
      onSuccess: () => {
        setSnapshotReady(true);
        setError(null);
      },
    });
  }, [firebaseUid, queryClient]);

  syncFromServerRef.current = syncAssignmentsFromServer;

  useTechnicianAssignmentsFirestoreListener({
    hookEnabled,
    noFirebaseAuth,
    queryClient,
    syncFromServerRef,
    listenerHydratedRef,
    knownAssignmentIdsRef,
    setFirebaseUid,
    setError,
    setSnapshotReady,
  });

  const resyncParams = {
    hookEnabled,
    firebaseUid,
    noFirebaseAuth,
    syncFromServerRef,
  };

  useTechnicianAssignmentsResyncEffects(resyncParams);
  useTechnicianAssignmentsPolling({
    ...resyncParams,
    hookEnabled: pollingEnabled,
  });

  return { interventions, loading, error, firebaseUid };
}
