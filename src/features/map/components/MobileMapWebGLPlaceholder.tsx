"use client";

import type { Mission } from "@/features/map/missionTypes";
import { useTranslation } from "@/core/i18n/I18nContext";
import { MapPin } from "lucide-react";

type Props = {
  missions: Mission[];
  onMissionClick?: (mission: Mission) => void;
};

function mapsUrl(mission: Mission): string | null {
  if (mission.address?.trim()) {
    return `https://maps.apple.com/?q=${encodeURIComponent(mission.address.trim())}`;
  }
  const coords = mission.coordinates;
  if (coords && Number.isFinite(coords[0]) && Number.isFinite(coords[1])) {
    return `https://maps.apple.com/?ll=${coords[1]},${coords[0]}`;
  }
  return null;
}

/** Centre du hub carte mobile sans WebGL — liste légère + lien Plans. */
export default function MobileMapWebGLPlaceholder({ missions, onMissionClick }: Props) {
  const { t } = useTranslation();

  return (
    <div
      className="flex h-full min-h-0 flex-col bg-gradient-to-b from-slate-50 to-slate-100"
      data-testid="mobile-map-webgl-off"
    >
      <div className="shrink-0 border-b border-slate-200/80 bg-white/80 px-4 py-3 backdrop-blur-sm">
        <p className="text-[15px] font-semibold text-slate-900">
          {String(t("map.mobile.webgl_off_title"))}
        </p>
        <p className="mt-1 text-[13px] leading-snug text-slate-600">
          {String(t("map.mobile.webgl_off_body"))}
        </p>
      </div>

      <ul className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-3 py-3">
        {missions.length === 0 ? (
          <li className="rounded-xl border border-dashed border-slate-200 bg-white/60 px-4 py-8 text-center text-[13px] text-slate-500">
            {String(t("map.mobile.webgl_off_empty"))}
          </li>
        ) : (
          missions.map((mission) => {
            const href = mapsUrl(mission);
            return (
              <li key={mission.key ?? mission.id} className="mb-2">
                <button
                  type="button"
                  onClick={() => onMissionClick?.(mission)}
                  className="w-full rounded-xl border border-slate-200/90 bg-white px-3 py-3 text-left shadow-sm transition-colors active:bg-slate-50"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[14px] font-semibold text-slate-900">
                        {mission.clientName}
                      </p>
                      <p className="mt-0.5 text-[12px] text-slate-500">{mission.time}</p>
                      {mission.address ? (
                        <p className="mt-1 line-clamp-2 text-[12px] text-slate-600">
                          {mission.address}
                        </p>
                      ) : null}
                    </div>
                    {href ? (
                      <a
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="shrink-0 rounded-lg border border-blue-200 bg-blue-50 p-2 text-blue-600"
                        aria-label={String(t("map.mobile.open_in_maps"))}
                      >
                        <MapPin className="h-4 w-4" aria-hidden />
                      </a>
                    ) : null}
                  </div>
                </button>
              </li>
            );
          })
        )}
      </ul>

      <p className="shrink-0 border-t border-slate-200/80 px-4 py-2 text-center text-[11px] text-slate-400">
        {String(t("map.mobile.webgl_off_hint"))}
      </p>
    </div>
  );
}
