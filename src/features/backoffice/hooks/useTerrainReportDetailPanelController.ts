"use client";

import { useState } from "react";
import { useTranslation } from "@/core/i18n/I18nContext";
import { capitalizeName, formatAddress } from "@/utils/stringUtils";
import { auth } from "@/core/config/firebase";
import { logCrmInterventionAction } from "@/features/crmHistory/logCrmInterventionAction";
import { canArchiveBackofficeReportInInbox } from "@/features/backoffice/backofficeReportsInboxArchive";
import {
  readTerrainReportTranscription,
  type TerrainReportDetailPanelProps,
} from "@/features/backoffice/terrainReportDetailPanelTypes";

export function useTerrainReportDetailPanelController({
  report: r,
  iv,
  terrainBridge,
  onClose,
  onReject,
}: TerrainReportDetailPanelProps) {
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
  const canArchiveReport = Boolean(iv && canArchiveBackofficeReportInInbox(iv));
  const transcription = iv ? readTerrainReportTranscription(iv) : null;

  const handleDismiss = () => {
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
  };

  const openRejectForm = () => setRejectOpen(true);

  const cancelReject = () => {
    setRejectOpen(false);
    setRejectReason("");
  };

  const handleRejectConfirm = () => {
    onReject(r.interventionId, rejectReason.trim() || undefined);
    setRejectOpen(false);
    setRejectReason("");
  };

  return {
    t,
    r,
    iv,
    rejectOpen,
    rejectReason,
    setRejectReason,
    displayName,
    phone,
    email,
    address,
    description,
    isAlreadyValidated,
    canArchiveReport,
    transcription,
    handleDismiss,
    openRejectForm,
    cancelReject,
    handleRejectConfirm,
  };
}
