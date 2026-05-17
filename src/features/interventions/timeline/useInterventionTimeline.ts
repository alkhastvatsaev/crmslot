"use client";

import { useEffect, useState } from "react";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { firestore } from "@/core/config/firebase";
import type { InterventionEvent } from "@/features/interventions/types";
import { subscribeInterventionEmails, type InterventionEmailDoc } from "@/features/emails/interventionEmailFirestore";
import { addInterventionTimelineComment } from "@/features/interventions/timeline/addInterventionTimelineComment";
import { mergeInterventionTimelineEvents } from "@/features/interventions/timeline/mergeInterventionTimeline";
import type { InterventionTimelineDoc } from "@/features/interventions/timeline/interventionTimelineTypes";
import type { InterventionStatusEvent } from "@/features/interventions/workflow/interventionWorkflowTypes";
import {
  subscribeMaterialOrders,
  type MaterialOrderDoc,
} from "@/features/materials/materialOrderFirestore";

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

function mapTimelineDoc(id: string, data: Record<string, unknown>): InterventionTimelineDoc {
  return {
    interventionId: String(data.interventionId ?? ""),
    type: (data.type as InterventionTimelineDoc["type"]) ?? "comment",
    content: String(data.content ?? ""),
    visibility: data.visibility === "client" ? "client" : "internal",
    createdAt: String(data.createdAt ?? ""),
    createdByUid: String(data.createdByUid ?? ""),
    companyId: typeof data.companyId === "string" ? data.companyId : null,
  };
}

export function useInterventionTimeline(
  interventionId: string | null,
  options?: { clientVisibleOnly?: boolean; companyId?: string | null },
) {
  const [events, setEvents] = useState<InterventionEvent[]>([]);
  const [loading, setLoading] = useState(Boolean(interventionId));

  useEffect(() => {
    if (!interventionId || !firestore) {
      setEvents([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    let statusRows: InterventionStatusEvent[] = [];
    let timelineRows: Array<{ id: string; data: InterventionTimelineDoc }> = [];
    let emailRows: InterventionEmailDoc[] = [];
    let materialRows: MaterialOrderDoc[] = [];

    const publish = () => {
      setEvents(
        mergeInterventionTimelineEvents(statusRows, timelineRows, {
          clientVisibleOnly: options?.clientVisibleOnly,
          emails: emailRows,
          materialOrders: materialRows,
        }),
      );
      setLoading(false);
    };

    const unsubStatus = onSnapshot(
      query(
        collection(firestore, "interventions", interventionId, "status_events"),
        orderBy("at", "asc"),
      ),
      (snap) => {
        statusRows = snap.docs.map((d) => mapStatusEventDoc(d.id, d.data() as Record<string, unknown>));
        publish();
      },
      () => {
        statusRows = [];
        publish();
      },
    );

    const unsubTimeline = onSnapshot(
      query(
        collection(firestore, "interventions", interventionId, "timeline_events"),
        orderBy("createdAt", "asc"),
      ),
      (snap) => {
        timelineRows = snap.docs.map((d) => ({
          id: d.id,
          data: mapTimelineDoc(d.id, d.data() as Record<string, unknown>),
        }));
        publish();
      },
      () => {
        timelineRows = [];
        publish();
      },
    );

    const unsubEmails = subscribeInterventionEmails(
      firestore,
      interventionId,
      (rows) => {
        emailRows = rows;
        publish();
      },
      () => {
        emailRows = [];
        publish();
      },
    );

    const unsubMaterials = subscribeMaterialOrders(firestore, interventionId, (rows) => {
      materialRows = rows;
      publish();
    });

    return () => {
      unsubStatus();
      unsubTimeline();
      unsubEmails();
      unsubMaterials();
    };
  }, [interventionId, options?.clientVisibleOnly]);

  const addComment = async (content: string) => {
    if (!interventionId) throw new Error("Aucun dossier sélectionné");
    await addInterventionTimelineComment({
      interventionId,
      content,
      companyId: options?.companyId ?? null,
      visibility: "internal",
    });
  };

  return { events, loading, addComment };
}
