"use client";

import { useEffect, useState } from "react";
import { firestore } from "@/core/config/firebase";
import { subscribeCommissionRules } from "./commissionFirestore";
import type { CommissionRule } from "./types";
import { scheduleEffectUpdate } from "@/utils/scheduleEffectUpdate";

export function useCommissionRules(companyId: string | null) {
  const activeCompanyId = companyId?.trim() || null;
  const [rules, setRules] = useState<CommissionRule[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!activeCompanyId || !firestore) return;
    scheduleEffectUpdate(() => setLoading(true));
    const unsub = subscribeCommissionRules(firestore, activeCompanyId, (rows) => {
      setRules(rows);
      setLoading(false);
    });
    return unsub;
  }, [activeCompanyId]);

  return { rules: activeCompanyId ? rules : [], loading: activeCompanyId ? loading : false };
}
