"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { useDashboardPagerOptional } from "@/features/dashboard";
import { GMAIL_HUB_SLOT_INDEX } from "@/features/gmail/gmailHubConstants";
import type { useGmailHub } from "@/features/gmail/useGmailHub";
import { useTranslation } from "@/core/i18n/I18nContext";

type GmailHub = ReturnType<typeof useGmailHub>;

export function useGmailHubOAuthReturn(hub: GmailHub) {
  const { t } = useTranslation();
  const pager = useDashboardPagerOptional();
  const oauthReturnHandled = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined" || oauthReturnHandled.current) return;
    const params = new URLSearchParams(window.location.search);
    const connected = params.get("gmail_connected");
    const oauthError = params.get("gmail_error");
    if (!connected && !oauthError) return;

    oauthReturnHandled.current = true;
    pager?.setPageIndex(GMAIL_HUB_SLOT_INDEX);

    const cleanOAuthQuery = () => {
      const url = new URL(window.location.href);
      url.searchParams.delete("gmail_connected");
      url.searchParams.delete("gmail_error");
      const next = url.pathname + (url.search || "");
      window.history.replaceState({}, "", next);
    };

    if (connected === "1") {
      void (async () => {
        await hub.refreshStatus({ silent: true });
        await hub.refreshLabels();
        toast.success(String(t("gmail.hub.connected_ok")));
        cleanOAuthQuery();
      })();
      return;
    }

    const errKey =
      oauthError === "access_denied"
        ? "gmail.hub.oauth_denied"
        : oauthError === "no_refresh_token"
          ? "gmail.hub.oauth_no_refresh"
          : "gmail.hub.oauth_failed";
    toast.error(String(t(errKey)));
    cleanOAuthQuery();
  }, [hub, pager, t]);
}
