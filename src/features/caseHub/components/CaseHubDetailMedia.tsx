"use client";

import { useMemo } from "react";
import { Loader2 } from "lucide-react";
import { useTranslation } from "@/core/i18n/I18nContext";
import { useResolvedInterventionAudio } from "@/features/backoffice/useResolvedInterventionAudio";
import RequestDetailAudioPlayer from "@/features/backoffice/components/RequestDetailAudioPlayer";
import CaseHubDetailStep from "@/features/caseHub/components/CaseHubDetailStep";
import { CASE_HUB_DETAIL } from "@/features/caseHub/caseHubDetailTheme";
import type { Intervention } from "@/features/interventions/types";
import {
  clientIntakePhotoUrls,
  technicianCompletionPhotoUrls,
  technicianSignatureUrl,
} from "@/features/planningHub/planningInterventionDetailFields";

type Props = {
  intervention: Intervention;
  hasAudio: boolean;
};

export default function CaseHubDetailMedia({ intervention, hasAudio }: Props) {
  const { t } = useTranslation();
  const { resolvedAudioUrl, isResolvingAudio, audioStorageResolveFailed } =
    useResolvedInterventionAudio(hasAudio ? intervention : null);

  const clientPhotos = useMemo(() => clientIntakePhotoUrls(intervention), [intervention]);
  const completionPhotos = useMemo(
    () => technicianCompletionPhotoUrls(intervention),
    [intervention]
  );
  const signatureUrl = useMemo(() => technicianSignatureUrl(intervention), [intervention]);

  const hasPhotos = clientPhotos.length > 0 || completionPhotos.length > 0;
  const hasContent = hasAudio || hasPhotos || Boolean(signatureUrl);

  if (!hasContent) return null;

  return (
    <CaseHubDetailStep
      step={5}
      title={t("caseHub.pipeline.step_media")}
      testId="case-hub-detail-media"
    >
      <div className="space-y-3">
        {hasAudio ? (
          <div data-testid="case-hub-detail-audio">
            {isResolvingAudio ? (
              <div className="flex items-center gap-2 text-[12px] text-slate-500">
                <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                {t("caseHub.right.audio_loading")}
              </div>
            ) : resolvedAudioUrl ? (
              <RequestDetailAudioPlayer url={resolvedAudioUrl} />
            ) : audioStorageResolveFailed ? (
              <p className="text-[12px] text-rose-600">{t("caseHub.right.audio_failed")}</p>
            ) : null}
          </div>
        ) : null}

        {clientPhotos.length > 0 ? (
          <div data-testid="case-hub-client-photos" className="grid grid-cols-3 gap-2">
            {clientPhotos.map((url, index) => (
              <div key={`${url}-${index}`} className={CASE_HUB_DETAIL.photoTile}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt="" className="h-full w-full object-cover" />
              </div>
            ))}
          </div>
        ) : null}

        {completionPhotos.length > 0 ? (
          <div data-testid="case-hub-completion-photos" className="grid grid-cols-3 gap-2">
            {completionPhotos.map((url, index) => (
              <div key={`${url}-${index}`} className={CASE_HUB_DETAIL.photoTile}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt="" className="h-full w-full object-cover" />
              </div>
            ))}
          </div>
        ) : null}

        {signatureUrl ? (
          <div
            data-testid="case-hub-signature"
            className="rounded-[14px] bg-slate-50 p-3 ring-1 ring-inset ring-slate-100"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={signatureUrl}
              alt={t("planningHub.detail.fields.signature_yes")}
              className="mx-auto max-h-20 object-contain"
            />
          </div>
        ) : null}
      </div>
    </CaseHubDetailStep>
  );
}
