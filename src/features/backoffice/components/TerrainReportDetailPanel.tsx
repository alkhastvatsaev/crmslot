"use client";

import { X } from "lucide-react";
import { motion } from "framer-motion";
import { HubDetailHeader } from "@/core/ui/hub";
import TerrainReportClientCard from "@/features/backoffice/components/TerrainReportClientCard";
import TerrainReportAudioSection from "@/features/backoffice/components/TerrainReportAudioSection";
import TerrainReportPhotosGrid from "@/features/backoffice/components/TerrainReportPhotosGrid";
import TerrainReportSignatureSection from "@/features/backoffice/components/TerrainReportSignatureSection";
import TerrainReportRejectForm from "@/features/backoffice/components/TerrainReportRejectForm";
import TerrainReportActionBar from "@/features/backoffice/components/TerrainReportActionBar";
import InterventionInvoicePreviewCard from "@/features/billing/components/InterventionInvoicePreviewCard";
import { invoicePreviewFromIntervention } from "@/features/billing/invoicePreviewFromIntervention";
import { useTerrainReportDetailPanelController } from "@/features/backoffice/hooks/useTerrainReportDetailPanelController";
import type { TerrainReportDetailPanelProps } from "@/features/backoffice/terrainReportDetailPanelTypes";

export default function TerrainReportDetailPanel(props: TerrainReportDetailPanelProps) {
  const c = useTerrainReportDetailPanelController(props);

  return (
    <motion.div
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={{ type: "spring", damping: 25, stiffness: 200 }}
      className="absolute inset-0 z-30 flex flex-col bg-white rounded-[inherit] shadow-2xl"
    >
      <HubDetailHeader
        title={String(c.t("backoffice.inbox.terrain_report"))}
        onBack={props.onClose}
        backLabel={String(c.t("common.back"))}
        rightAction={
          <button
            type="button"
            onClick={c.handleDismiss}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition-colors hover:bg-slate-200"
            aria-label={c.t("backoffice.inbox.hide_report")}
          >
            <X className="h-5 w-5" />
          </button>
        }
      />

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        <TerrainReportClientCard
          displayName={c.displayName}
          phone={c.phone}
          email={c.email}
          address={c.address}
          description={c.description}
          problemPrefix={String(c.t("backoffice.inbox.problem_prefix"))}
        />

        <TerrainReportAudioSection
          interventionId={c.r.interventionId}
          audioUrl={props.terrainResolvedAudioUrl}
          loading={props.terrainAudioLoading}
          failed={props.terrainAudioFailed}
          voiceMessageLabel={String(c.t("backoffice.inbox.voice_message"))}
          voiceLoadingLabel={String(c.t("backoffice.inbox.voice_loading"))}
          voiceStorageErrorLabel={String(c.t("backoffice.inbox.voice_storage_error"))}
          voiceEmptyLabel={String(c.t("backoffice.inbox.voice_empty"))}
          transcription={c.transcription}
        />

        <TerrainReportPhotosGrid
          localId={c.r.localId}
          photoDataUrls={c.r.photoDataUrls}
          photosLabel={String(c.t("backoffice.inbox.photos"))}
        />

        <TerrainReportSignatureSection
          signaturePngDataUrl={c.r.signaturePngDataUrl}
          signatureLabel={String(c.t("backoffice.inbox.signature_client"))}
          signatureAlt={String(c.t("backoffice.inbox.signature_alt"))}
        />

        {c.iv ? <InterventionInvoicePreviewCard {...invoicePreviewFromIntervention(c.iv)} /> : null}

        {c.rejectOpen ? (
          <TerrainReportRejectForm
            rejectReason={c.rejectReason}
            rejectReasonLabel={String(c.t("backoffice.inbox.reject_reason_label"))}
            rejectReasonPlaceholder={String(c.t("backoffice.inbox.reject_reason_placeholder"))}
            rejectSendLabel={String(c.t("backoffice.inbox.reject_send"))}
            cancelLabel={String(c.t("common.cancel"))}
            onRejectReasonChange={c.setRejectReason}
            onConfirm={c.handleRejectConfirm}
            onCancel={c.cancelReject}
          />
        ) : null}
      </div>

      <TerrainReportActionBar
        report={c.r}
        iv={c.iv}
        rejectOpen={c.rejectOpen}
        isAlreadyValidated={c.isAlreadyValidated}
        canArchiveReport={c.canArchiveReport}
        rejectReportLabel={String(c.t("backoffice.inbox.reject_report"))}
        verifyReportLabel={String(c.t("backoffice.inbox.verify_report"))}
        alreadyVerifiedLabel={String(c.t("backoffice.inbox.already_verified"))}
        verifyReportAria={String(c.t("backoffice.inbox.verify_terrain_report_aria"))}
        archiveReportLabel={String(c.t("backoffice.inbox.archive_report"))}
        archiveReportAria={String(c.t("backoffice.inbox.archive_report_aria"))}
        onOpenReject={c.openRejectForm}
        onVerify={props.onVerify}
        onArchiveReport={props.onArchiveReport}
      />
    </motion.div>
  );
}
