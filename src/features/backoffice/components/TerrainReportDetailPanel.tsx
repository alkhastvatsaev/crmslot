"use client";

import { useState } from "react";
import { CheckCircle2, RotateCcw, Send, X } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { HubActionBar, HubButton, HubCard, HubDetailHeader, HUB_TYPE } from "@/core/ui/hub";
import { useTranslation } from "@/core/i18n/I18nContext";
import { capitalizeName, formatAddress } from "@/utils/stringUtils";
import { auth } from "@/core/config/firebase";
import { logCrmInterventionAction } from "@/features/crmHistory/logCrmInterventionAction";
import { devUiPreviewEnabled } from "@/core/config/devUiPreview";
import { PRESENTATION_PRIVACY_MODE } from "@/core/config/presentationMode";
import type { Intervention } from "@/features/interventions/types";
import type {
  BridgedTechnicianReport,
  TechnicianBackofficeReportBridgeApi,
} from "@/context/TechnicianBackofficeReportBridgeContext";
import RequestDetailAudioPlayer from "@/features/backoffice/components/RequestDetailAudioPlayer";
import InterventionInvoicePreviewCard from "@/features/billing/components/InterventionInvoicePreviewCard";
import { invoicePreviewFromIntervention } from "@/features/billing/invoicePreviewFromIntervention";

function readTranscription(inv: unknown): string | null {
  if (!inv || typeof inv !== "object") return null;
  const anyInv = inv as Record<string, unknown>;
  const candidates = [anyInv.transcription, anyInv.audioTranscription, anyInv.audio_transcription];
  const hit = candidates.find((v) => typeof v === "string" && v.trim().length > 0);
  return typeof hit === "string" ? hit : null;
}

type Props = {
  report: BridgedTechnicianReport;
  iv: Intervention | null;
  terrainBridge: TechnicianBackofficeReportBridgeApi | null;
  terrainResolvedAudioUrl: string | null;
  terrainAudioLoading: boolean;
  terrainAudioFailed: boolean;
  onClose: () => void;
  onVerify: (id: string) => void;
  onReject: (id: string, reason?: string) => void;
};

export default function TerrainReportDetailPanel({
  report: r,
  iv,
  terrainBridge,
  terrainResolvedAudioUrl,
  terrainAudioLoading,
  terrainAudioFailed,
  onClose,
  onVerify,
  onReject,
}: Props) {
  const { t } = useTranslation();
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  const first = iv?.clientFirstName ?? "";
  const last = iv?.clientLastName ?? "";
  const fallbackName = iv?.clientName ?? "";
  const nameRaw = `${first} ${last}`.trim() || fallbackName;
  const displayName = nameRaw ? capitalizeName(nameRaw) : `Client · …${r.interventionId.slice(-8)}`;
  const phone = iv?.clientPhone ?? "";
  const email = iv?.clientEmail ?? "";
  const address = iv?.address ? formatAddress(iv.address) : "";
  const description = iv?.problem || iv?.title || "";
  const isAlreadyValidated = iv?.status === "invoiced";

  const handleRejectConfirm = () => {
    onReject(r.interventionId, rejectReason.trim() || undefined);
    setRejectOpen(false);
    setRejectReason("");
  };

  return (
    <motion.div
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={{ type: "spring", damping: 25, stiffness: 200 }}
      className="absolute inset-0 z-30 flex flex-col bg-white rounded-[inherit] shadow-2xl"
    >
      <HubDetailHeader
        title={String(t("backoffice.inbox.terrain_report"))}
        onBack={onClose}
        backLabel={String(t("common.back"))}
        rightAction={
          <button
            type="button"
            onClick={() => {
              const actorUid = auth?.currentUser?.uid?.trim() || "system";
              if (iv) {
                void logCrmInterventionAction({
                  kind: "bridged_report_dismissed",
                  iv,
                  actorUid,
                  actorRole: "dispatcher",
                  note: "Rapport terrain masqué (non supprimé)",
                });
              }
              terrainBridge?.dismissReport(r.localId);
              onClose();
            }}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition-colors hover:bg-slate-200"
            aria-label={t("backoffice.inbox.hide_report")}
          >
            <X className="h-5 w-5" />
          </button>
        }
      />

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        <HubCard tone="muted" padding="md" className="space-y-2">
          <p className="text-[14px] !font-extrabold text-slate-900">{displayName}</p>
          {phone ? <p className="text-[12px] !font-bold text-slate-700">{phone}</p> : null}
          {email ? (
            <p className="text-[12px] !font-bold text-slate-700 break-all">
              <a href={`mailto:${email}`} className="hover:underline">
                {email}
              </a>
            </p>
          ) : null}
          {address ? <p className="text-[12px] !font-bold text-slate-700">{address}</p> : null}
          {description ? (
            <p className="text-[13px] !font-bold text-slate-800 leading-relaxed">
              {t("backoffice.inbox.problem_prefix")} · {description}
            </p>
          ) : null}
        </HubCard>

        <div className="space-y-3">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
            {t("backoffice.inbox.voice_message")}
          </p>
          {terrainResolvedAudioUrl ? (
            <RequestDetailAudioPlayer
              key={`terrain-${r.interventionId}-${terrainResolvedAudioUrl}`}
              url={terrainResolvedAudioUrl}
            />
          ) : terrainAudioLoading ? (
            <div
              data-testid="backoffice-terrain-report-audio-loading"
              className="flex w-full items-center gap-3 rounded-[16px] border border-dashed border-slate-200 bg-slate-50/70 px-4 py-4"
              aria-busy="true"
              aria-label={t("backoffice.inbox.voice_loading")}
            >
              <div
                className="h-11 w-11 shrink-0 animate-pulse rounded-full bg-slate-200"
                aria-hidden
              />
              <div className="flex min-w-0 flex-1 flex-col gap-2.5">
                <div className="h-2 w-full animate-pulse rounded-full bg-slate-200" />
                <div className="flex justify-between gap-2">
                  <div className="h-2 w-10 animate-pulse rounded bg-slate-200" />
                  <div className="h-2 w-10 animate-pulse rounded bg-slate-200" />
                </div>
              </div>
              <div
                className="h-11 w-11 shrink-0 animate-pulse rounded-full bg-slate-200/80"
                aria-hidden
              />
            </div>
          ) : terrainAudioFailed ? (
            <div
              data-testid="backoffice-terrain-report-audio-storage-error"
              className="w-full rounded-[16px] border border-amber-200/90 bg-amber-50/80 px-4 py-4 text-center text-[13px] font-semibold leading-snug text-amber-950"
            >
              {t("backoffice.inbox.voice_storage_error")}
            </div>
          ) : (
            <div
              data-testid="backoffice-terrain-report-audio-empty"
              className="w-full rounded-[16px] border border-dashed border-slate-200 bg-slate-50/60 px-4 py-4 text-center text-[13px] font-semibold text-slate-500"
            >
              {t("backoffice.inbox.voice_empty")}
            </div>
          )}
          {iv && readTranscription(iv) ? (
            <div className="rounded-[16px] border border-blue-100 bg-blue-50/50 p-4 text-sm italic text-blue-900">
              &quot;{readTranscription(iv)}&quot;
            </div>
          ) : null}
        </div>

        <div className="space-y-3">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
            {t("backoffice.inbox.photos")}
          </p>
          <div className="grid grid-cols-2 gap-2">
            {r.photoDataUrls.map((url, i) => (
              <div
                key={`${r.localId}-detail-ph-${i}`}
                className="aspect-square relative rounded-[16px] overflow-hidden border border-slate-100 bg-slate-50 shadow-sm"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={url}
                  alt=""
                  className={cn(
                    "w-full h-full object-cover",
                    PRESENTATION_PRIVACY_MODE || devUiPreviewEnabled ? "blur-lg" : null
                  )}
                />
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
            {t("backoffice.inbox.signature_client")}
          </p>
          <div className="rounded-[16px] bg-slate-50 p-4 border border-slate-100 flex items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={r.signaturePngDataUrl}
              alt={t("backoffice.inbox.signature_alt")}
              className="max-h-32 object-contain"
            />
          </div>
        </div>

        {iv ? <InterventionInvoicePreviewCard {...invoicePreviewFromIntervention(iv)} /> : null}

        {/* Reject inline form */}
        {rejectOpen ? (
          <div
            data-testid="backoffice-reject-form"
            className="rounded-2xl border border-amber-200 bg-amber-50 p-4 space-y-3"
          >
            <p className="text-[13px] font-bold text-amber-900">
              {t("backoffice.inbox.reject_reason_label")}
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder={t("backoffice.inbox.reject_reason_placeholder")}
              rows={3}
              className="w-full rounded-xl border border-amber-200 bg-white px-3 py-2 text-[13px] text-slate-800 outline-none focus:border-amber-400 placeholder:text-slate-400 resize-none"
              autoFocus
            />
            <div className="flex gap-2">
              <HubButton
                type="button"
                variant="dangerOutline"
                data-testid="backoffice-reject-confirm"
                onClick={handleRejectConfirm}
                className="flex-1"
              >
                <Send className="h-4 w-4" />
                {t("backoffice.inbox.reject_send")}
              </HubButton>
              <HubButton
                type="button"
                onClick={() => {
                  setRejectOpen(false);
                  setRejectReason("");
                }}
                className="shrink-0"
              >
                {t("common.cancel")}
              </HubButton>
            </div>
          </div>
        ) : null}
      </div>

      <HubActionBar>
        {!rejectOpen && !isAlreadyValidated && iv ? (
          <HubButton
            type="button"
            data-testid="backoffice-reject-report-btn"
            onClick={() => setRejectOpen(true)}
          >
            <RotateCcw className="h-4 w-4" />
            {t("backoffice.inbox.reject_report")}
          </HubButton>
        ) : null}

        <HubButton
          type="button"
          variant="success"
          emphasis
          data-testid={`backoffice-bridged-report-validate-${r.localId}`}
          disabled={!iv || isAlreadyValidated}
          onClick={() => void onVerify(r.interventionId)}
          className={cn(
            isAlreadyValidated &&
              "cursor-not-allowed bg-emerald-100 text-emerald-700 opacity-70 shadow-none hover:bg-emerald-100",
            !iv && "cursor-not-allowed bg-slate-100 text-slate-400 shadow-none hover:bg-slate-100"
          )}
          aria-label={t("backoffice.inbox.verify_terrain_report_aria")}
        >
          <CheckCircle2 className="h-4 w-4" />
          {isAlreadyValidated
            ? t("backoffice.inbox.already_verified")
            : t("backoffice.inbox.verify_report")}
        </HubButton>
      </HubActionBar>
    </motion.div>
  );
}
