"use client";

import { useMemo } from "react";
import { useTranslation } from "@/core/i18n/I18nContext";
import type { Intervention } from "@/features/interventions/types";
import {
  buildClientIntakeFields,
  buildTechnicianReportFields,
  clientIntakePhotoUrls,
  technicianCompletionPhotoUrls,
  technicianSignatureUrl,
} from "@/features/planningHub/planningInterventionDetailFields";

type Props = {
  intervention: Intervention;
};

function FactSection({
  title,
  testId,
  fields,
  photoUrls,
  signatureUrl,
}: {
  title: string;
  testId: string;
  fields: ReturnType<typeof buildClientIntakeFields>;
  photoUrls?: string[];
  signatureUrl?: string | null;
}) {
  const { t } = useTranslation();
  const photos = photoUrls ?? [];
  const hasContent = fields.length > 0 || photos.length > 0 || Boolean(signatureUrl);
  if (!hasContent) return null;

  return (
    <section data-testid={testId} className="space-y-2">
      <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{title}</h3>
      {fields.length > 0 ? (
        <dl className="space-y-2 rounded-2xl border border-black/[0.05] bg-white/95 p-3">
          {fields.map((field) => (
            <div key={field.id}>
              <dt className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                {t(field.labelKey)}
              </dt>
              <dd className="mt-0.5 whitespace-pre-wrap text-[12px] leading-snug text-slate-800">
                {field.value}
              </dd>
            </div>
          ))}
        </dl>
      ) : null}
      {photos.length > 0 ? (
        <div className="grid grid-cols-3 gap-1.5">
          {photos.map((url, index) => (
            <div
              key={`${url}-${index}`}
              className="aspect-square overflow-hidden rounded-xl border border-slate-100 bg-slate-50"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="" className="h-full w-full object-cover" />
            </div>
          ))}
        </div>
      ) : null}
      {signatureUrl ? (
        <div className="rounded-xl border border-slate-100 bg-slate-50 p-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={signatureUrl}
            alt={t("planningHub.detail.fields.signature_yes")}
            className="mx-auto max-h-20 object-contain"
          />
        </div>
      ) : null}
    </section>
  );
}

/** Faits client + terrain — complète les onglets du drawer sans les dupliquer entièrement. */
export default function CaseHubDetailFacts({ intervention }: Props) {
  const { t } = useTranslation();

  const clientFields = useMemo(() => buildClientIntakeFields(intervention), [intervention]);
  const technicianFields = useMemo(() => buildTechnicianReportFields(intervention), [intervention]);
  const clientPhotos = useMemo(() => clientIntakePhotoUrls(intervention), [intervention]);
  const completionPhotos = useMemo(
    () => technicianCompletionPhotoUrls(intervention),
    [intervention]
  );
  const signatureUrl = useMemo(() => technicianSignatureUrl(intervention), [intervention]);

  return (
    <div
      data-testid="case-hub-detail-facts"
      className="flex shrink-0 flex-col gap-4 border-b border-black/[0.05] px-4 py-3"
    >
      <FactSection
        title={t("caseHub.right.client_facts")}
        testId="case-hub-client-facts"
        fields={clientFields}
        photoUrls={clientPhotos}
      />
      <FactSection
        title={t("caseHub.right.technician_facts")}
        testId="case-hub-technician-facts"
        fields={technicianFields}
        photoUrls={completionPhotos}
        signatureUrl={signatureUrl}
      />
    </div>
  );
}
