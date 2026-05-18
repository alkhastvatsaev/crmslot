"use client";

import { useEffect, useState } from "react";
import { firestore } from "@/core/config/firebase";
import { subscribeInterventionCommission } from "@/features/commissions/commissionFirestore";
import type { InterventionCommission } from "@/features/commissions/types";
import { scheduleEffectUpdate } from "@/utils/scheduleEffectUpdate";

export function useInterventionCommission(interventionId: string | null) {
  const activeId = interventionId?.trim() || null;
  const [commission, setCommission] = useState<InterventionCommission | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!activeId || !firestore) return;
    scheduleEffectUpdate(() => setLoading(true));
    const unsub = subscribeInterventionCommission(firestore, activeId, (row) => {
      setCommission(row);
      setLoading(false);
    });
    return unsub;
  }, [activeId]);

  return {
    commission: activeId ? commission : null,
    loading: activeId ? loading : false,
  };
}
