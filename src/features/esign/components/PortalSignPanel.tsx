"use client";

import { useState } from "react";
import { PenLine } from "lucide-react";
import { toast } from "sonner";
import { fetchWithAuth } from "@/core/api/fetchWithAuth";
import { useFeatureFlag } from "@/core/useFeatureFlags";
import { useTranslation } from "@/core/i18n/I18nContext";

type Props = {
  interventionId: string;
  clientName?: string;
  clientEmail?: string;
  /** Lien suivi public — utilise l'API anonyme `/api/portal/[token]/request-signature`. */
  portalToken?: string;
};

export default function PortalSignPanel({
  interventionId,
  clientName,
  clientEmail,
  portalToken,
}: Props) {
  const { t } = useTranslation();
  const enabled = useFeatureFlag("remoteESign");
  const [busy, setBusy] = useState(false);
  const [signUrl, setSignUrl] = useState<string | null>(null);

  if (!enabled) return null;

  const handleRequest = async () => {
    setBusy(true);
    try {
      const body = JSON.stringify({
        documentType: "report",
        signerName: clientName ?? "Client",
        signerEmail: clientEmail ?? "",
      });
      const res = portalToken?.trim()
        ? await fetch(`/api/portal/${encodeURIComponent(portalToken.trim())}/request-signature`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body,
          })
        : await fetchWithAuth(
            `/api/interventions/${encodeURIComponent(interventionId)}/request-signature`,
            { method: "POST", headers: { "Content-Type": "application/json" }, body }
          );
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        signUrl?: string;
        error?: string;
      };
      if (!res.ok) throw new Error(data.error ?? "Échec");
      setSignUrl(data.signUrl ?? null);
      toast.success(String(t("esign.request_sent")));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(t("common.error")));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      data-testid="portal-sign-panel"
      className="rounded-xl border border-amber-100 bg-amber-50 p-4 space-y-2"
    >
      <div className="flex items-center gap-2 font-semibold text-amber-900">
        <PenLine className="h-4 w-4" />
        {t("esign.portal_title")}
      </div>
      <p className="text-sm text-amber-800">{t("esign.portal_hint")}</p>
      {signUrl ? (
        <a
          href={signUrl}
          data-testid="portal-sign-link"
          className="inline-block rounded-lg bg-amber-600 px-4 py-2 text-sm font-bold text-white"
        >
          {t("esign.open_sign_page")}
        </a>
      ) : (
        <button
          type="button"
          disabled={busy}
          data-testid="portal-sign-request"
          onClick={() => void handleRequest()}
          className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
        >
          {t("esign.request_button")}
        </button>
      )}
    </div>
  );
}
