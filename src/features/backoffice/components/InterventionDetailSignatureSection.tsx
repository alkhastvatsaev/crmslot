"use client";

import { useTranslation } from "@/core/i18n/I18nContext";

type Props = {
  signatureUrl: string;
};

export default function InterventionDetailSignatureSection({ signatureUrl }: Props) {
  const { t } = useTranslation();

  return (
    <div className="space-y-3" data-testid="backoffice-report-detail-signature-section">
      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
        {t("backoffice.inbox.signature_client")}
      </span>
      <div className="rounded-[16px] bg-slate-50 p-4 border border-slate-100 flex items-center justify-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={signatureUrl}
          alt={t("backoffice.inbox.signature_alt")}
          className="max-h-32 object-contain"
        />
      </div>
    </div>
  );
}
