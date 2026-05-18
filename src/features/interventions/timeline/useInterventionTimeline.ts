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
import {
  subscribeCommissionAudit,
  type CommissionAuditRow,
} from "@/features/commissions/commissionFirestore";
import {
  subscribePortalChatForIntervention,
  type IvanaPortalChatDoc,
} from "@/features/backoffice/ivanaChatFirestore";
import { scheduleEffectUpdate } from "@/utils/scheduleEffectUpdate";

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
  const activeId = interventionId?.trim() || null;
  const [events, setEvents] = useState<InterventionEvent[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!activeId || !firestore) return;

    scheduleEffectUpdate(() => setLoading(true));
    let statusRows: InterventionStatusEvent[] = [];
    let timelineRows: Array<{ id: string; data: InterventionTimelineDoc }> = [];
    let emailRows: InterventionEmailDoc[] = [];
    let materialRows: MaterialOrderDoc[] = [];
    let commissionRows: CommissionAuditRow[] = [];
    let portalChatRows: IvanaPortalChatDoc[] = [];

    const publish = () => {
      setEvents(
        mergeInterventionTimelineEvents(statusRows, timelineRows, {
          clientVisibleOnly: options?.clientVisibleOnly,
          emails: emailRows,
          materialOrders: materialRows,
          commissionAudit: commissionRows,
          portalChat: portalChatRows,
        }),
      );
      setLoading(false);
    };

    let unsubStatus: (() => void) | undefined;
    const unsubEmails = subscribeInterventionEmails(
      firestore,
      activeId,
      (rows) => {
        emailRows = rows;
        publish();
      },
      () => {
        emailRows = [];
        publish();
      },
    );

    let unsubTimeline: (() => void) | undefined;
    const timeout = setTimeout(() => {
      unsubStatus = onSnapshot(
        query(
          collection(firestore!, "interventions", activeId, "status_events"),
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

      unsubTimeline = onSnapshot(
        query(
          collection(firestore!, "interventions", activeId, "timeline_events"),
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
    }, 10);

    const unsubMaterials = subscribeMaterialOrders(firestore, activeId, (rows) => {
      materialRows = rows;
      publish();
    });

    const unsubCommission = subscribeCommissionAudit(firestore, activeId, (rows) => {
      commissionRows = rows;
      publish();
    });

    const unsubPortalChat = subscribePortalChatForIntervention(
      firestore,
      activeId,
      (rows) => {
        portalChatRows = rows;
        publish();
      },
      () => {
        portalChatRows = [];
        publish();
      },
    );

    return () => {
      clearTimeout(timeout);
      unsubStatus?.();
      unsubTimeline?.();
      unsubEmails();
      unsubMaterials();
      unsubCommission();
      unsubPortalChat();
    };
  }, [activeId, options?.clientVisibleOnly]);

  const addComment = async (content: string) => {
    if (!activeId) throw new Error("Aucun dossier sélectionné");
    await addInterventionTimelineComment({
      interventionId: activeId,
      content,
      companyId: options?.companyId ?? null,
      visibility: "internal",
    });
  };

  return {
    events: activeId ? events : [],
    loading: activeId ? loading : false,
    addComment,
  };
}
