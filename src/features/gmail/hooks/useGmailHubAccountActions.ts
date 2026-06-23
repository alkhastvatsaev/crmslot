"use client";

import { useCallback } from "react";
import { toast } from "sonner";
import { fetchWithAuth } from "@/core/api/fetchWithAuth";
import type { useGmailHub } from "@/features/gmail/useGmailHub";

type GmailHub = ReturnType<typeof useGmailHub>;

export function useGmailHubAccountActions(params: {
  hub: GmailHub;
  t: (key: string) => string;
  closePdfPreview: () => void;
  setSelectedId: (id: string | null) => void;
  setComposing: (v: boolean) => void;
}) {
  const { hub, t, closePdfPreview, setSelectedId, setComposing } = params;

  const handleConnect = useCallback(async () => {
    try {
      const res = await fetchWithAuth("/api/integrations/gmail/auth-url");
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !data.url) {
        throw new Error(data.error ?? "Impossible de démarrer OAuth Gmail.");
      }
      window.location.href = data.url;
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(t("common.error")));
    }
  }, [t]);

  const handleDisconnect = useCallback(() => {
    if (!window.confirm(String(t("gmail.hub.disconnect_confirm")))) return;
    void (async () => {
      try {
        closePdfPreview();
        setSelectedId(null);
        setComposing(false);
        hub.setSelectedMessage(null);
        await hub.disconnectGmail();
        toast.success(String(t("gmail.hub.disconnected_ok")));
      } catch (e) {
        toast.error(e instanceof Error ? e.message : String(t("common.error")));
      }
    })();
  }, [hub, closePdfPreview, setSelectedId, setComposing, t]);

  return { handleConnect, handleDisconnect };
}
