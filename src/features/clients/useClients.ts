"use client";

import { useEffect, useState } from "react";
import { firestore, isConfigured } from "@/core/config/firebase";
import { useCompanyWorkspaceOptional } from "@/context/CompanyWorkspaceContext";
import { useFeatureFlag } from "@/core/useFeatureFlags";
import { readClientsOfflineCache, writeClientsOfflineCache } from "./clientCrmOfflineCache";
import { subscribeClients } from "./clientFirestore";
import type { ClientRecord } from "./types";

export function useClients(): { clients: ClientRecord[]; loading: boolean; offline: boolean } {
  const crmEnabled = useFeatureFlag("crmContacts");
  const workspace = useCompanyWorkspaceOptional();
  const companyId = workspace?.activeCompanyId?.trim() ?? "";
  const [clients, setClients] = useState<ClientRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    if (!crmEnabled || !companyId) {
      setClients([]);
      setLoading(false);
      setOffline(false);
      return () => {};
    }

    if (!firestore || !isConfigured) {
      setClients(readClientsOfflineCache(companyId));
      setLoading(false);
      setOffline(true);
      return () => {};
    }

    const cached = readClientsOfflineCache(companyId);
    if (cached.length > 0) {
      setClients(cached);
    }
    setLoading(true);
    setOffline(false);

    return subscribeClients(
      firestore,
      companyId,
      (rows) => {
        setClients(rows);
        writeClientsOfflineCache(companyId, rows);
        setLoading(false);
        setOffline(false);
      },
      () => {
        const fallback = readClientsOfflineCache(companyId);
        setClients(fallback);
        setLoading(false);
        setOffline(fallback.length > 0);
      },
    );
  }, [crmEnabled, companyId]);

  return { clients, loading, offline };
}
