"use client";

import { useEffect, useState } from "react";
import { firestore } from "@/core/config/firebase";
import { subscribeCommissionRules } from "./commissionFirestore";
import type { CommissionRule } from "./types";

export function useCommissionRules(companyId: string | null) {
  const [rules, setRules] = useState<CommissionRule[]>([]);
  const [loading, setLoading] = useState(Boolean(companyId));

  useEffect(() => {
    if (!companyId || !firestore) {
      setRules([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const unsub = subscribeCommissionRules(firestore, companyId, (rows) => {
      setRules(rows);
      setLoading(false);
    });
    return unsub;
  }, [companyId]);

  return { rules, loading };
}
