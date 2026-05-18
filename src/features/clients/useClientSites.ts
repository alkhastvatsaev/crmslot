"use client";

import { useEffect, useState } from "react";
import { firestore, isConfigured } from "@/core/config/firebase";
import { useFeatureFlag } from "@/core/useFeatureFlags";
import { subscribeClientSites } from "./clientFirestore";
import type { SiteRecord } from "./types";

export function useClientSites(
  companyId: string | null,
  clientId: string | null,
): { sites: SiteRecord[]; loading: boolean } {
  const crmEnabled = useFeatureFlag("crmContacts");
  const [sites, setSites] = useState<SiteRecord[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const cid = companyId?.trim() ?? "";
    const clid = clientId?.trim() ?? "";
    if (!crmEnabled || !firestore || !isConfigured || !cid || !clid) {
      setSites([]);
      setLoading(false);
      return () => {};
    }
    setLoading(true);
    return subscribeClientSites(
      firestore,
      cid,
      clid,
      (rows) => {
        setSites(rows);
        setLoading(false);
      },
      () => setLoading(false),
    );
  }, [crmEnabled, companyId, clientId]);

  return { sites, loading: crmEnabled && Boolean(clientId) ? loading : false };
}
