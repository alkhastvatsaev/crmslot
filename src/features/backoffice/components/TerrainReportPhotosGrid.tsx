"use client";

import { cn } from "@/lib/utils";
import { PRESENTATION_PRIVACY_MODE } from "@/core/config/presentationMode";

type Props = {
  localId: string;
  photoDataUrls: string[];
  photosLabel: string;
};

export default function TerrainReportPhotosGrid({ localId, photoDataUrls, photosLabel }: Props) {
  return (
    <div className="space-y-3">
      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
        {photosLabel}
      </p>
      <div className="grid grid-cols-2 gap-2">
        {photoDataUrls.map((url, i) => (
          <div
            key={`${localId}-detail-ph-${i}`}
            className="aspect-square relative rounded-[16px] overflow-hidden border border-slate-100 bg-slate-50 shadow-sm"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={url}
              alt=""
              className={cn(
                "w-full h-full object-cover",
                PRESENTATION_PRIVACY_MODE ? "blur-lg" : null
              )}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
