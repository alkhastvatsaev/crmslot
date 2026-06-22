"use client";

import { Mic } from "lucide-react";
import { useFeatureFlag } from "@/core/useFeatureFlags";
import { useMobileGalaxyComposerOpenApi } from "@/context/MobileGalaxyComposerOpenContext";
import { useDashboardPagerOptional } from "@/features/dashboard/dashboardPagerContext";
import { useIsMobile } from "@/features/dashboard/hooks/useIsMobile";
import { useMobileFooterGalaxyVisible } from "@/features/dashboard/hooks/useMobileFooterGalaxyVisible";
import { useGalaxyLayerBridgeOptional } from "@/features/map/GalaxyLayerBridgeContext";
import { useTranslation } from "@/core/i18n/I18nContext";

/** Sur carte mobile : lance le dispatch vocal (Galaxy dock) sans l’afficher en permanence. */
export default function MapMobileDispatchArmButton() {
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const dispatchVoice = useFeatureFlag("dispatchVoice");
  const pager = useDashboardPagerOptional();
  const bridge = useGalaxyLayerBridgeOptional();
  const composerApi = useMobileGalaxyComposerOpenApi();
  const galaxyVisible = useMobileFooterGalaxyVisible();

  if (isMobile !== true || !dispatchVoice || pager?.pageIndex !== 0 || galaxyVisible) {
    return null;
  }

  return (
    <button
      type="button"
      data-testid="map-mobile-dispatch-arm"
      className="pointer-events-auto absolute bottom-3 left-1/2 z-30 flex -translate-x-1/2 items-center gap-2 rounded-full border border-white/20 bg-slate-900/85 px-4 py-2 text-xs font-semibold text-white shadow-lg backdrop-blur-md"
      onClick={() => {
        bridge?.armTranscription();
        composerApi?.requestOpen();
      }}
    >
      <Mic className="h-4 w-4" aria-hidden />
      {t("map.dispatch.arm_audio")}
    </button>
  );
}
