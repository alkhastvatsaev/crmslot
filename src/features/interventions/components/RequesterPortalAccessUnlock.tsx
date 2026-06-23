"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "@/core/i18n/I18nContext";
import { useRequesterHub } from "@/context/RequesterHubContext";
import type { PortalAccessSession } from "@/features/interventions/portalAccessSession";
import RequesterSubmittedDossierBanner from "@/features/interventions/components/RequesterSubmittedDossierBanner";

type VerifyResponse = {
  emailNormalized: string;
  interventions: PortalAccessSession["interventions"];
  error?: string;
};

type Props = {
  suggestedDossierNumber?: string | null;
};

export default function RequesterPortalAccessUnlock({ suggestedDossierNumber = null }: Props) {
  const { t } = useTranslation();
  const { setPortalAccessSession } = useRequesterHub();
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!code.trim()) return;

    setBusy(true);
    try {
      const res = await fetch("/api/portal/access/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.trim() }),
      });
      const data = (await res.json()) as VerifyResponse;
      if (!res.ok) {
        throw new Error(data.error ?? "Accès refusé");
      }

      setPortalAccessSession({
        emailNormalized: data.emailNormalized,
        verifiedAt: new Date().toISOString(),
        interventionIds: data.interventions.map((row) => row.id),
        interventions: data.interventions,
      });
      toast.success(String(t("tracking.portal_access_unlocked")));
    } catch (error) {
      toast.error(String(t("tracking.portal_access_failed")), {
        description: error instanceof Error ? error.message : undefined,
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <section
      data-testid="tracking-portal-access-section"
      className="flex min-h-0 flex-1 flex-col items-center justify-center px-4 py-6"
    >
      <form
        data-testid="tracking-portal-access-unlock"
        onSubmit={(event) => void handleSubmit(event)}
        className="flex w-full max-w-[300px] flex-col gap-4"
      >
        {suggestedDossierNumber ? (
          <RequesterSubmittedDossierBanner compact dossierNumber={suggestedDossierNumber} />
        ) : null}

        <div className="text-center">
          <p className="text-[14px] leading-relaxed text-slate-500">
            {t("tracking.portal_access_hint")}
          </p>
        </div>

        <input
          type="text"
          value={code}
          onChange={(event) => setCode(event.target.value.toUpperCase())}
          placeholder={String(t("tracking.portal_access_dossier_number"))}
          data-testid="tracking-portal-access-code"
          autoComplete="one-time-code"
          className="h-12 w-full rounded-xl border border-black/[0.06] bg-white px-4 text-[15px] uppercase tracking-[0.18em] outline-none focus-visible:ring-2 focus-visible:ring-slate-900/15"
        />
        <button
          type="submit"
          disabled={busy || !code.trim()}
          data-testid="tracking-portal-access-submit"
          className="flex h-12 items-center justify-center rounded-xl bg-slate-900 text-[15px] font-medium text-white disabled:opacity-50"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : t("tracking.portal_access_submit")}
        </button>
      </form>
    </section>
  );
}
