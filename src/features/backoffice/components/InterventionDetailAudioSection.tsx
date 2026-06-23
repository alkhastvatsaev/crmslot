"use client";

import { useTranslation } from "@/core/i18n/I18nContext";
import RequestDetailAudioPlayer from "@/features/backoffice/components/RequestDetailAudioPlayer";
import { readTranscription } from "@/features/backoffice/components/interventionDetailHelpers";
import type { Intervention } from "@/features/interventions/types";

type Props = {
  selectedItem: Intervention;
  resolvedAudioUrl: string | null;
  isResolvingAudio: boolean;
  audioStorageResolveFailed: boolean;
};

export default function InterventionDetailAudioSection({
  selectedItem,
  resolvedAudioUrl,
  isResolvingAudio,
  audioStorageResolveFailed,
}: Props) {
  const { t } = useTranslation();
  const transcription = readTranscription(selectedItem);

  return (
    <div className="space-y-3">
      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
        {t("backoffice.inbox.voice_message")}
      </span>
      {resolvedAudioUrl ? (
        <RequestDetailAudioPlayer
          key={`${selectedItem.id}-${resolvedAudioUrl}`}
          url={resolvedAudioUrl}
        />
      ) : isResolvingAudio ? (
        <div
          data-testid="backoffice-request-detail-audio-loading"
          className="flex w-full items-center gap-3 rounded-[16px] border border-dashed border-slate-200 bg-slate-50/70 px-4 py-4"
          aria-busy="true"
          aria-label={t("backoffice.inbox.voice_loading")}
        >
          <div className="h-11 w-11 shrink-0 animate-pulse rounded-full bg-slate-200" aria-hidden />
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
      ) : audioStorageResolveFailed ? (
        <div
          data-testid="backoffice-request-detail-audio-storage-error"
          className="w-full rounded-[16px] border border-amber-200/90 bg-amber-50/80 px-4 py-4 text-center text-[13px] font-semibold leading-snug text-amber-950"
        >
          {t("backoffice.inbox.voice_storage_error")}
        </div>
      ) : (
        <div
          data-testid="backoffice-request-detail-audio-empty"
          className="w-full rounded-[16px] border border-dashed border-slate-200 bg-slate-50/60 px-4 py-4 text-center text-[13px] font-semibold text-slate-500"
        >
          {t("backoffice.inbox.voice_empty")}
        </div>
      )}
      {transcription ? (
        <div className="rounded-[16px] border border-blue-100 bg-blue-50/50 p-4 text-sm italic text-blue-900">
          &quot;{transcription}&quot;
        </div>
      ) : null}
    </div>
  );
}
