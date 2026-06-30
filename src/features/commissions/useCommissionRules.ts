"use client";

import { useEffect, useState } from "react";
import { firestore } from "@/core/config/firebase";
import { logger } from "@/core/logger";
import { subscribeCommissionRules } from "./commissionFirestore";
import type { CommissionRule } from "./types";
import { scheduleEffectUpdate } from "@/utils/scheduleEffectUpdate";

export function useCommissionRules(companyId: string | null) {
  const activeCompanyId = companyId?.trim() || null;
  const [rules, setRules] = useState<CommissionRule[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!activeCompanyId || !firestore) {
      setRules([]);
      setLoading(false);
      return;
    }

    let pendingLoad = true;
    const unsub = subscribeCommissionRules(
      firestore,
      activeCompanyId,
      (rows) => {
        pendingLoad = false;
        setRules(rows);
        setLoading(false);
      },
      (error) => {
        pendingLoad = false;
        logger.warn("[useCommissionRules] listener error", {
          companyId: activeCompanyId,
          error: error.message,
        });
        setRules([]);
        setLoading(false);
      }
    );
    scheduleEffectUpdate(() => {
      if (pendingLoad) setLoading(true);
    });
    return unsub;
  }, [activeCompanyId]);

  return { rules: activeCompanyId ? rules : [], loading: activeCompanyId ? loading : false };
}
