"use client";

import RequestDetailAudioPlayer from "@/features/backoffice/components/RequestDetailAudioPlayer";

type Props = {
  interventionId: string;
  audioUrl: string | null;
  loading: boolean;
  failed: boolean;
  voiceMessageLabel: string;
  voiceLoadingLabel: string;
  voiceStorageErrorLabel: string;
  voiceEmptyLabel: string;
  transcription: string | null;
};

export default function TerrainReportAudioSection({
  interventionId,
  audioUrl,
  loading,
  failed,
  voiceMessageLabel,
  voiceLoadingLabel,
  voiceStorageErrorLabel,
  voiceEmptyLabel,
  transcription,
}: Props) {
  return (
    <div className="space-y-3">
      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
        {voiceMessageLabel}
      </p>
      {audioUrl ? (
        <RequestDetailAudioPlayer key={`terrain-${interventionId}-${audioUrl}`} url={audioUrl} />
      ) : loading ? (
        <div
          data-testid="backoffice-terrain-report-audio-loading"
          className="flex w-full items-center gap-3 rounded-[16px] border border-dashed border-slate-200 bg-slate-50/70 px-4 py-4"
          aria-busy="true"
          aria-label={voiceLoadingLabel}
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
      ) : failed ? (
        <div
          data-testid="backoffice-terrain-report-audio-storage-error"
          className="w-full rounded-[16px] border border-amber-200/90 bg-amber-50/80 px-4 py-4 text-center text-[13px] font-semibold leading-snug text-amber-950"
        >
          {voiceStorageErrorLabel}
        </div>
      ) : (
        <div
          data-testid="backoffice-terrain-report-audio-empty"
          className="w-full rounded-[16px] border border-dashed border-slate-200 bg-slate-50/60 px-4 py-4 text-center text-[13px] font-semibold text-slate-500"
        >
          {voiceEmptyLabel}
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
