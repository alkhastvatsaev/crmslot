"use client";

import { useTranslation } from "@/core/i18n/I18nContext";
import type { Intervention } from "@/features/interventions";

type Props = {
  selectedItem: Intervention;
  showTechnicianAmendmentAlert: boolean;
  amendedByName: string;
};

export default function InterventionDetailAlertsSection({
  selectedItem,
  showTechnicianAmendmentAlert,
  amendedByName,
}: Props) {
  const { t } = useTranslation();

  return (
    <>
      {showTechnicianAmendmentAlert ? (
        <div
          data-testid="backoffice-technician-amendment-alert"
          className="rounded-2xl border border-amber-200 bg-amber-50 p-4"
        >
          <p className="text-[12px] font-bold text-amber-900">
            {String(t("backoffice.inbox.technician_amendment_alert_title"))}
          </p>
          <p className="mt-1 text-[13px] leading-snug text-amber-950">
            {String(t("backoffice.inbox.technician_amendment_alert_body")).replace(
              "{{name}}",
              amendedByName || String(t("backoffice.inbox.unknown_technician"))
            )}
          </p>
        </div>
      ) : null}

      {selectedItem.invoiceReviewRequestedAt ? (
        <div
          data-testid="backoffice-invoice-review-alert"
          className="rounded-2xl border border-amber-200 bg-amber-50 p-4 space-y-1"
        >
          <p className="text-[12px] font-bold text-amber-900">
            {t("backoffice.inbox.invoice_review_alert_title")}
          </p>
          {selectedItem.invoiceReviewNote ? (
            <p className="text-[13px] leading-snug text-amber-950">
              {selectedItem.invoiceReviewNote}
            </p>
          ) : null}
        </div>
      ) : null}
    </>
  );
}
