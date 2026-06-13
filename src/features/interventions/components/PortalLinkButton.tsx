"use client";

import { useState } from "react";
import { Link2, Copy, Check } from "lucide-react";
import { toast } from "sonner";
import { fetchWithAuth } from "@/core/api/fetchWithAuth";
import { useTranslation } from "@/core/i18n/I18nContext";
import type { Intervention } from "@/features/interventions/types";

type Props = { intervention: Pick<Intervention, "id" | "portalAccessToken"> };

export default function PortalLinkButton({ intervention }: Props) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);

  const handleCopy = async () => {
    setBusy(true);
    try {
      const res = await fetchWithAuth(
        `/api/interventions/${encodeURIComponent(intervention.id)}/portal-token`,
        { method: "POST" }
      );
      const data = (await res.json()) as { ok?: boolean; portalUrl?: string; error?: string };
      if (!res.ok || !data.portalUrl) throw new Error(data.error ?? "Échec");
      await navigator.clipboard.writeText(data.portalUrl);
      setCopied(true);
      toast.success(String(t("portal.link_copied")));
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(t("common.error")));
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      type="button"
      data-testid="portal-link-copy"
      disabled={busy}
      onClick={() => void handleCopy()}
      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
    >
      {copied ? (
        <Check className="h-3.5 w-3.5 text-emerald-600" />
      ) : (
        <Link2 className="h-3.5 w-3.5" />
      )}
      {copied ? t("portal.link_copied_short") : t("portal.copy_link")}
      {!copied ? <Copy className="h-3 w-3 opacity-50" /> : null}
    </button>
  );
}
