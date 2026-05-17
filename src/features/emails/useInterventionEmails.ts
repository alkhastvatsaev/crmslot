"use client";

import { useEffect, useMemo, useState } from "react";
import { firestore } from "@/core/config/firebase";
import {
  subscribeInterventionEmails,
  type InterventionEmailDoc,
} from "./interventionEmailFirestore";

export function useInterventionEmails(interventionId: string | null) {
  const [emails, setEmails] = useState<InterventionEmailDoc[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!interventionId || !firestore) {
      setEmails([]);
      return;
    }
    setLoading(true);
    const unsub = subscribeInterventionEmails(
      firestore,
      interventionId,
      (rows) => {
        setEmails(rows);
        setLoading(false);
      },
      () => setLoading(false),
    );
    return unsub;
  }, [interventionId]);

  const unreadCount = useMemo(
    () => emails.filter((e) => e.direction === "inbound" && !e.readAt).length,
    [emails],
  );

  return { emails, loading, unreadCount };
}
