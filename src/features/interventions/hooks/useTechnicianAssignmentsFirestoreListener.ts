"use client";

import { useEffect, type MutableRefObject } from "react";
import type { QueryClient } from "@tanstack/react-query";
import { onAuthStateChanged } from "firebase/auth";
import { onSnapshot } from "firebase/firestore";
import { auth, firestore } from "@/core/config/firebase";
import { logger } from "@/core/logger";
import type { Intervention } from "@/features/interventions/types";
import { TECHNICIAN_ASSIGNMENTS_QUERY_KEY } from "@/features/offline/technicianQueryKeys";
import { getTechnicianAssignmentUid } from "@/features/interventions/technicianAssignmentActions";
import {
  fetchTechnicianAssignments,
  technicianAssignmentsFirestoreQuery,
} from "@/features/interventions/technicianAssignmentsQuery";
import { applyTechnicianAssignmentsToCache } from "@/features/interventions/technicianAssignmentsHookCache";
import {
  notifyTechnicianNewAssignments,
  syncTechnicianAssignmentsFromServer,
} from "@/features/interventions/technicianAssignmentsSync";
import { newAssignmentIdsFromSnapshotChanges } from "@/features/interventions/technicianNewAssignmentAlerts";

type FirestoreListenerParams = {
  hookEnabled: boolean;
  noFirebaseAuth: boolean;
  queryClient: QueryClient;
  syncFromServerRef: MutableRefObject<(() => Promise<void>) | null>;
  listenerHydratedRef: MutableRefObject<boolean>;
  knownAssignmentIdsRef: MutableRefObject<Set<string>>;
  setFirebaseUid: (uid: string | null) => void;
  setError: (error: string | null) => void;
  setSnapshotReady: (ready: boolean) => void;
};

export function useTechnicianAssignmentsFirestoreListener(params: FirestoreListenerParams): void {
  const {
    hookEnabled,
    noFirebaseAuth,
    queryClient,
    syncFromServerRef,
    listenerHydratedRef,
    knownAssignmentIdsRef,
    setFirebaseUid,
    setError,
    setSnapshotReady,
  } = params;

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
            applyTechnicianAssignmentsToCache(queryClient, technicianUid, data);
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
            notifyTechnicianNewAssignments(addedRows);
            void syncFromServerRef.current?.();
          }

          applyTechnicianAssignmentsToCache(queryClient, technicianUid, data);
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
          applyTechnicianAssignmentsToCache(queryClient, technicianUid, data);
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
  }, [
    queryClient,
    hookEnabled,
    noFirebaseAuth,
    syncFromServerRef,
    listenerHydratedRef,
    knownAssignmentIdsRef,
    setFirebaseUid,
    setError,
    setSnapshotReady,
  ]);
}
