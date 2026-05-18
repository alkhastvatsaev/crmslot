"use client";

import { useEffect, useMemo, useState } from "react";
import { firestore } from "@/core/config/firebase";
import {
  subscribeInterventionEmails,
  type InterventionEmailDoc,
} from "./interventionEmailFirestore";
import { scheduleEffectUpdate } from "@/utils/scheduleEffectUpdate";

export function useInterventionEmails(interventionId: string | null) {
  const activeId = interventionId?.trim() || null;
  const [emails, setEmails] = useState<InterventionEmailDoc[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!activeId || !firestore) return;
    scheduleEffectUpdate(() => setLoading(true));
    const unsub = subscribeInterventionEmails(
      firestore,
      activeId,
      (rows) => {
        setEmails(rows);
        setLoading(false);
      },
      () => setLoading(false),
    );
    return unsub;
  }, [activeId]);

  const visibleEmails = activeId ? emails : [];
  const unreadCount = useMemo(
    () => visibleEmails.filter((e) => e.direction === "inbound" && !e.readAt).length,
    [visibleEmails],
  );

  return { emails: visibleEmails, loading: activeId ? loading : false, unreadCount };
}
