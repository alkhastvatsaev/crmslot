"use client";

import { useEffect, useState } from "react";
import { firestore, isConfigured } from "@/core/config/firebase";
import { useCompanyWorkspaceOptional } from "@/context/CompanyWorkspaceContext";
import { useFeatureFlag } from "@/core/useFeatureFlags";
import { subscribeClients } from "./clientFirestore";
import type { ClientRecord } from "./types";

export function useClients(): { clients: ClientRecord[]; loading: boolean } {
  const crmEnabled = useFeatureFlag("crmContacts");
  const workspace = useCompanyWorkspaceOptional();
  const companyId = workspace?.activeCompanyId?.trim() ?? "";
  const [clients, setClients] = useState<ClientRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!crmEnabled || !firestore || !isConfigured || !companyId) {
      setClients([]);
      setLoading(false);
      return () => {};
    }
    setLoading(true);
    return subscribeClients(
      firestore,
      companyId,
      (rows) => {
        setClients(rows);
        setLoading(false);
      },
      () => setLoading(false),
    );
  }, [crmEnabled, companyId]);

  return { clients, loading };
}
