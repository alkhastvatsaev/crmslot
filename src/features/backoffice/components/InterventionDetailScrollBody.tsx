"use client";

import EquipmentPanel from "@/features/equipment/components/EquipmentPanel";
import DuplicateWarningBanner from "@/features/interventions/components/DuplicateWarningBanner";
import InterventionInvoicePreviewCard from "@/features/billing/components/InterventionInvoicePreviewCard";
import { invoicePreviewFromIntervention } from "@/features/billing/invoicePreviewFromIntervention";
import InterventionDetailRejectForm from "@/features/backoffice/components/InterventionDetailRejectForm";
import InterventionDetailClientHeader from "@/features/backoffice/components/InterventionDetailClientHeader";
import InterventionDetailAddressSection from "@/features/backoffice/components/InterventionDetailAddressSection";
import InterventionDetailProblemSection from "@/features/backoffice/components/InterventionDetailProblemSection";
import InterventionDetailScheduleSection from "@/features/backoffice/components/InterventionDetailScheduleSection";
import InterventionDetailPhotosSection from "@/features/backoffice/components/InterventionDetailPhotosSection";
import InterventionDetailAudioSection from "@/features/backoffice/components/InterventionDetailAudioSection";
import InterventionDetailSignatureSection from "@/features/backoffice/components/InterventionDetailSignatureSection";
import InterventionDetailAlertsSection from "@/features/backoffice/components/InterventionDetailAlertsSection";
import InterventionDetailQuotePdfButton from "@/features/backoffice/components/InterventionDetailQuotePdfButton";
import { useInterventionDetailScrollBody } from "@/features/backoffice/hooks/useInterventionDetailScrollBody";
import type { Intervention } from "@/features/interventions/types";

type Props = {
  selectedItem: Intervention;
  cid: string | null;
  pwaV2: boolean;
  resolvedAudioUrl: string | null;
  isResolvingAudio: boolean;
  audioStorageResolveFailed: boolean;
  selectedReportCompletion: { photoUrls: string[]; signatureUrl: string | null };
  onDownloadQuotePdf: (id: string) => void;
  canRejectReport: boolean;
  rejectOpen: boolean;
  rejectBusy: boolean;
  rejectReason: string;
  setRejectReason: (value: string) => void;
  setRejectOpen: (open: boolean) => void;
  onRejectConfirm: () => void | Promise<void>;
};

export default function InterventionDetailScrollBody({
  selectedItem,
  cid,
  pwaV2,
  resolvedAudioUrl,
  isResolvingAudio,
  audioStorageResolveFailed,
  selectedReportCompletion,
  onDownloadQuotePdf,
  canRejectReport,
  rejectOpen,
  rejectBusy,
  rejectReason,
  setRejectReason,
  setRejectOpen,
  onRejectConfirm,
}: Props) {
  const { isInRequestsQueue, amendedByName, showTechnicianAmendmentAlert } =
    useInterventionDetailScrollBody(selectedItem);

  const showPhotos =
    (isInRequestsQueue && selectedItem.attachmentThumbnails) ||
    (!isInRequestsQueue && selectedReportCompletion.photoUrls.length > 0);

  return (
    <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto p-6 space-y-8">
      <InterventionDetailClientHeader selectedItem={selectedItem} />

      <InterventionDetailAddressSection selectedItem={selectedItem} />

      <InterventionDetailProblemSection
        selectedItem={selectedItem}
        isInRequestsQueue={isInRequestsQueue}
      />

      {cid && selectedItem.address && (selectedItem.problem || selectedItem.title) ? (
        <DuplicateWarningBanner
          interventionId={selectedItem.id}
          address={selectedItem.address}
          problem={selectedItem.problem ?? selectedItem.title ?? ""}
          companyId={cid}
          client={{
            firstName: selectedItem.clientFirstName ?? undefined,
            lastName: selectedItem.clientLastName ?? undefined,
            phone: selectedItem.clientPhone ?? selectedItem.phone ?? undefined,
            email: selectedItem.clientEmail ?? undefined,
          }}
        />
      ) : null}

      {pwaV2 ? (
        <InterventionDetailQuotePdfButton
          interventionId={selectedItem.id}
          onDownloadQuotePdf={onDownloadQuotePdf}
        />
      ) : null}

      {isInRequestsQueue ? <InterventionDetailScheduleSection selectedItem={selectedItem} /> : null}

      {showPhotos ? (
        <InterventionDetailPhotosSection
          selectedItem={selectedItem}
          isInRequestsQueue={isInRequestsQueue}
          photoUrls={selectedReportCompletion.photoUrls}
        />
      ) : null}

      {isInRequestsQueue ? (
        <InterventionDetailAudioSection
          selectedItem={selectedItem}
          resolvedAudioUrl={resolvedAudioUrl}
          isResolvingAudio={isResolvingAudio}
          audioStorageResolveFailed={audioStorageResolveFailed}
        />
      ) : null}

      {selectedItem.clientId ? (
        <div className="space-y-1" data-testid="backoffice-equipment-section">
          <EquipmentPanel clientId={selectedItem.clientId} />
        </div>
      ) : null}

      {!isInRequestsQueue && selectedReportCompletion.signatureUrl ? (
        <InterventionDetailSignatureSection signatureUrl={selectedReportCompletion.signatureUrl} />
      ) : null}

      {!isInRequestsQueue ? (
        <InterventionInvoicePreviewCard {...invoicePreviewFromIntervention(selectedItem)} />
      ) : null}

      <InterventionDetailAlertsSection
        selectedItem={selectedItem}
        showTechnicianAmendmentAlert={showTechnicianAmendmentAlert}
        amendedByName={amendedByName}
      />

      {canRejectReport && rejectOpen ? (
        <InterventionDetailRejectForm
          rejectBusy={rejectBusy}
          rejectReason={rejectReason}
          setRejectReason={setRejectReason}
          setRejectOpen={setRejectOpen}
          onConfirm={onRejectConfirm}
        />
      ) : null}
    </div>
  );
}
