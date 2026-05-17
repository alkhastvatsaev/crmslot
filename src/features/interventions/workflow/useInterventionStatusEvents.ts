"use client";

import { useEffect, useState } from "react";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { firestore } from "@/core/config/firebase";
import type { InterventionStatusEvent } from "@/features/interventions/workflow/interventionWorkflowTypes";

function mapStatusEventDoc(id: string, data: Record<string, unknown>): InterventionStatusEvent {
  return {
    id,
    interventionId: String(data.interventionId ?? ""),
    fromStatus: (data.fromStatus as InterventionStatusEvent["fromStatus"]) ?? null,
    toStatus: data.toStatus as InterventionStatusEvent["toStatus"],
    actorUid: String(data.actorUid ?? ""),
    actorRole: data.actorRole as InterventionStatusEvent["actorRole"],
    note: typeof data.note === "string" ? data.note : null,
    at: String(data.at ?? ""),
    companyId: typeof data.companyId === "string" ? data.companyId : null,
  };
}

/** Abonnement temps réel au journal des transitions d’un dossier. */
export function useInterventionStatusEvents(interventionId: string | null) {
  const [events, setEvents] = useState<InterventionStatusEvent[]>([]);
  const [loading, setLoading] = useState(Boolean(interventionId));

  useEffect(() => {
    if (!interventionId || !firestore) {
      setEvents([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const q = query(
      collection(firestore, "interventions", interventionId, "status_events"),
      orderBy("at", "asc"),
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        setEvents(
          snap.docs.map((d) => mapStatusEventDoc(d.id, d.data() as Record<string, unknown>)),
        );
        setLoading(false);
      },
      () => {
        setEvents([]);
        setLoading(false);
      },
    );

    return () => unsub();
  }, [interventionId]);

  return { events, loading };
}
