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
  type PlanningDetailField,
} from "@/features/planningHub/planningInterventionDetailFields";

function DetailSection({
  title,
  testId,
  fields,
  photoUrls,
  signatureUrl,
}: {
  title: string;
  testId: string;
  fields: PlanningDetailField[];
  photoUrls?: string[];
  signatureUrl?: string | null;
}) {
  const { t } = useTranslation();
  const photos = photoUrls ?? [];
  const hasContent = fields.length > 0 || photos.length > 0 || Boolean(signatureUrl);

  if (!hasContent) return null;

  return (
    <section data-testid={testId} className="space-y-3">
      <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{title}</h3>
      {fields.length > 0 ? (
        <dl className="space-y-2.5 rounded-[20px] border border-black/[0.05] bg-white/95 p-3">
          {fields.map((field) => (
            <div key={field.id}>
              <dt className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                {t(field.labelKey)}
              </dt>
              <dd className="mt-0.5 whitespace-pre-wrap text-[13px] leading-snug text-slate-800">
                {field.value}
              </dd>
            </div>
          ))}
        </dl>
      ) : null}
      {photos.length > 0 ? (
        <div className="grid grid-cols-2 gap-2">
          {photos.map((url, index) => (
            <div
              key={`${url}-${index}`}
              className="aspect-square overflow-hidden rounded-[16px] border border-slate-100 bg-slate-50"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="" className="h-full w-full object-cover" />
            </div>
          ))}
        </div>
      ) : null}
      {signatureUrl ? (
        <div className="rounded-[16px] border border-slate-100 bg-slate-50 p-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={signatureUrl}
            alt={t("planningHub.detail.fields.signature_yes")}
            className="mx-auto max-h-28 object-contain"
          />
        </div>
      ) : null}
    </section>
  );
}

type Props = {
  intervention: Intervention;
};

export default function PlanningHubInterventionDetail({ intervention }: Props) {
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
      data-testid="planning-hub-right-mission"
      className="custom-scrollbar flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto p-4"
    >
      <DetailSection
        title={t("planningHub.detail.client_section")}
        testId="planning-hub-client-data"
        fields={clientFields}
        photoUrls={clientPhotos}
      />
      <DetailSection
        title={t("planningHub.detail.technician_section")}
        testId="planning-hub-technician-data"
        fields={technicianFields}
        photoUrls={completionPhotos}
        signatureUrl={signatureUrl}
      />
    </div>
  );
}
