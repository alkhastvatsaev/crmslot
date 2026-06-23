"use client";

import { useCallback, useState } from "react";
import {
  disconnectGmailHubAccount,
  fetchGmailHubLabels,
  fetchGmailHubStatus,
} from "@/features/gmail/gmailHubApi";
import type { GmailHubLabel, GmailHubStatus } from "@/features/gmail/gmailHubTypes";

type UseGmailHubConnectionParams = {
  setError: (error: string | null) => void;
  onDisconnect?: () => void;
};

export function useGmailHubConnection({ setError, onDisconnect }: UseGmailHubConnectionParams) {
  const [status, setStatus] = useState<GmailHubStatus | null>(null);
  const [labels, setLabels] = useState<GmailHubLabel[]>([]);
  const [loadingStatus, setLoadingStatus] = useState(true);

  const refreshStatus = useCallback(
    async (opts?: { silent?: boolean }) => {
      if (!opts?.silent) setLoadingStatus(true);
      setError(null);
      try {
        const data = await fetchGmailHubStatus();
        setStatus(data);
        return data;
      } catch (e) {
        setError(e instanceof Error ? e.message : "Erreur Gmail.");
        return null;
      } finally {
        if (!opts?.silent) setLoadingStatus(false);
      }
    },
    [setError]
  );

  const refreshLabels = useCallback(async () => {
    try {
      const nextLabels = await fetchGmailHubLabels();
      setLabels(nextLabels);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur libellés.");
    }
  }, [setError]);

  const disconnectGmail = useCallback(async () => {
    await disconnectGmailHubAccount();
    onDisconnect?.();
    setLabels([]);
    await refreshStatus();
  }, [onDisconnect, refreshStatus]);

  return {
    status,
    labels,
    loadingStatus,
    refreshStatus,
    refreshLabels,
    disconnectGmail,
  };
}
