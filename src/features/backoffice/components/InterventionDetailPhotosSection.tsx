"use client";

import { cn } from "@/lib/utils";
import { useTranslation } from "@/core/i18n/I18nContext";
import { PRESENTATION_PRIVACY_MODE } from "@/core/config/presentationMode";
import type { Intervention } from "@/features/interventions/types";

type Props = {
  selectedItem: Intervention;
  isInRequestsQueue: boolean;
  photoUrls: string[];
};

export default function InterventionDetailPhotosSection({
  selectedItem,
  isInRequestsQueue,
  photoUrls,
}: Props) {
  const { t } = useTranslation();
  const urls = isInRequestsQueue ? selectedItem.attachmentThumbnails : photoUrls;

  if (!urls?.length) return null;

  return (
    <div className="space-y-3" data-testid="backoffice-report-detail-photos-section">
      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
        {isInRequestsQueue
          ? t("backoffice.inbox.photos_client")
          : t("backoffice.inbox.photos_completion")}
      </span>
      <div className="grid grid-cols-2 gap-2">
        {urls.map((url, i) => (
          <div
            key={i}
            className="aspect-square relative rounded-[16px] overflow-hidden border border-slate-100 bg-slate-50 shadow-sm"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={url}
              alt="Intervention"
              className={cn(
                "w-full h-full object-cover",
                !isInRequestsQueue && PRESENTATION_PRIVACY_MODE && "blur-lg"
              )}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
