"use client";

import { Loader2 } from "lucide-react";
import { useTranslation } from "@/core/i18n/I18nContext";
import { useResolvedInterventionAudio } from "@/features/backoffice/useResolvedInterventionAudio";
import RequestDetailAudioPlayer from "@/features/backoffice/components/RequestDetailAudioPlayer";
import type { Intervention } from "@/features/interventions/types";

type Props = {
  intervention: Intervention;
  hasAudio: boolean;
};

export default function CaseHubDetailAudio({ intervention, hasAudio }: Props) {
  const { t } = useTranslation();
  const { resolvedAudioUrl, isResolvingAudio, audioStorageResolveFailed } =
    useResolvedInterventionAudio(hasAudio ? intervention : null);

  if (!hasAudio) return null;

  return (
    <div
      data-testid="case-hub-detail-audio"
      className="flex shrink-0 flex-col gap-2 border-b border-black/[0.05] px-4 py-3"
    >
      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
        {t("caseHub.right.audio")}
      </p>
      {isResolvingAudio ? (
        <div className="flex items-center gap-2 text-[11px] text-slate-500">
          <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
          {t("caseHub.right.audio_loading")}
        </div>
      ) : resolvedAudioUrl ? (
        <RequestDetailAudioPlayer url={resolvedAudioUrl} />
      ) : audioStorageResolveFailed ? (
        <p className="text-[11px] text-rose-600">{t("caseHub.right.audio_failed")}</p>
      ) : null}
    </div>
  );
}
