"use client";

import { useEffect, useState } from "react";
import {
  collectionGroup,
  limit,
  onSnapshot,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import { firestore, isConfigured } from "@/core/config/firebase";
import { isFirestorePermissionDenied } from "@/core/firestore/firestoreClientErrors";
import type { InterventionStatusEvent } from "@/features/interventions/workflow/interventionWorkflowTypes";

const STATUS_EVENTS_LIMIT = 400;

export function useCompanyStatusEventsFeed(companyId: string | null) {
  const [events, setEvents] = useState<InterventionStatusEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const cid = (companyId ?? "").trim();
    if (!cid || !isConfigured || !firestore) {
      setEvents([]);
      setLoading(false);
      setError(null);
      return () => {};
    }

    setLoading(true);
    setError(null);

    const q = query(
      collectionGroup(firestore, "status_events"),
      where("companyId", "==", cid),
      orderBy("at", "desc"),
      limit(STATUS_EVENTS_LIMIT),
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        const rows = snap.docs.map(
          (d) => ({ id: d.id, ...d.data() }) as InterventionStatusEvent,
        );
        setEvents(rows);
        setLoading(false);
      },
      (e) => {
        if (isFirestorePermissionDenied(e)) {
          console.warn("[useCompanyStatusEventsFeed] permission denied — statuts ignorés", e);
          setError(null);
        } else {
          console.warn("[useCompanyStatusEventsFeed]", e);
          setError(e instanceof Error ? e.message : "Erreur Firestore");
        }
        setEvents([]);
        setLoading(false);
      },
    );

    return () => unsub();
  }, [companyId]);

  return { events, loading, error };
}
