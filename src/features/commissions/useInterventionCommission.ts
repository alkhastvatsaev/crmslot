"use client";

import { useEffect, useState } from "react";
import { firestore } from "@/core/config/firebase";
import { subscribeInterventionCommission } from "@/features/commissions/commissionFirestore";
import type { InterventionCommission } from "@/features/commissions/types";

export function useInterventionCommission(interventionId: string | null) {
  const [commission, setCommission] = useState<InterventionCommission | null>(null);
  const [loading, setLoading] = useState(Boolean(interventionId));

  useEffect(() => {
    if (!interventionId || !firestore) {
      setCommission(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const unsub = subscribeInterventionCommission(firestore, interventionId, (row) => {
      setCommission(row);
      setLoading(false);
    });
    return unsub;
  }, [interventionId]);

  return { commission, loading };
}
