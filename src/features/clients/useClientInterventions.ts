"use client";

import { useEffect, useState } from "react";
import { firestore, isConfigured } from "@/core/config/firebase";
import { useFeatureFlag } from "@/core/useFeatureFlags";
import { subscribeClientInterventions } from "@/features/clients/clientInterventions";
import type { Intervention } from "@/features/interventions/types";

export function useClientInterventions(
  companyId: string,
  clientId: string | null,
): { interventions: Intervention[]; loading: boolean } {
  const crmEnabled = useFeatureFlag("crmContacts");
  const [interventions, setInterventions] = useState<Intervention[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const cid = companyId.trim();
    const clid = clientId?.trim() ?? "";
    if (!crmEnabled || !firestore || !isConfigured || !cid || !clid) {
      setInterventions([]);
      setLoading(false);
      return () => {};
    }

    setLoading(true);
    return subscribeClientInterventions(
      firestore,
      cid,
      clid,
      (rows) => {
        setInterventions(rows);
        setLoading(false);
      },
      () => setLoading(false),
    );
  }, [crmEnabled, companyId, clientId]);

  return { interventions, loading };
}
