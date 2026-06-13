"use client";

import { useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle, Loader2, XCircle } from "lucide-react";
import { useTranslation } from "@/core/i18n/I18nContext";
import TechnicianSignaturePad, {
  type TechnicianSignaturePadHandle,
} from "@/features/interventions/components/TechnicianSignaturePad";

export default function PortalSignMockClient() {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const requestId = searchParams.get("request")?.trim() ?? "";
  const sigRef = useRef<TechnicianSignaturePadHandle>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<"signed" | "declined" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const submit = async (status: "signed" | "declined") => {
    if (!requestId || busy) return;
    if (status === "signed" && !sigRef.current?.getPngDataUrl()) {
      setError(String(t("esign.mock_signature_required")));
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/esign/mock-complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId, status }),
      });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        throw new Error(data.error ?? String(t("common.error")));
      }
      setDone(status);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(t("common.error")));
    } finally {
      setBusy(false);
    }
  };

  if (!requestId) {
    return (
      <p className="text-center text-sm text-red-600" data-testid="sign-mock-missing-request">
        {t("esign.mock_missing_request")}
      </p>
    );
  }

  if (done) {
    return (
      <div
        data-testid="sign-mock-done"
        className="flex flex-col items-center gap-3 py-8 text-center"
      >
        {done === "signed" ? (
          <CheckCircle className="h-12 w-12 text-emerald-600" aria-hidden />
        ) : (
          <XCircle className="h-12 w-12 text-slate-400" aria-hidden />
        )}
        <p className="text-lg font-semibold text-slate-900">
          {done === "signed" ? t("esign.mock_done_signed") : t("esign.mock_done_declined")}
        </p>
      </div>
    );
  }

  return (
    <div data-testid="sign-mock-page" className="mx-auto flex w-full max-w-lg flex-col gap-4">
      <header className="text-center">
        <h1 className="text-xl font-bold text-slate-900">{t("esign.mock_title")}</h1>
        <p className="mt-1 text-sm text-slate-600">{t("esign.mock_hint")}</p>
      </header>

      <div className="h-48 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
        <TechnicianSignaturePad ref={sigRef} fillHeight className="h-full min-h-0" />
      </div>

      {error ? (
        <p className="text-center text-sm text-red-600" data-testid="sign-mock-error">
          {error}
        </p>
      ) : null}

      <div className="flex flex-col gap-2 sm:flex-row">
        <button
          type="button"
          data-testid="sign-mock-submit"
          disabled={busy}
          onClick={() => void submit("signed")}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-sm font-bold text-white disabled:opacity-50"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {t("esign.mock_submit")}
        </button>
        <button
          type="button"
          data-testid="sign-mock-decline"
          disabled={busy}
          onClick={() => void submit("declined")}
          className="rounded-xl border border-slate-200 bg-white py-3 text-sm font-semibold text-slate-600 disabled:opacity-50"
        >
          {t("esign.mock_decline")}
        </button>
      </div>
    </div>
  );
}
