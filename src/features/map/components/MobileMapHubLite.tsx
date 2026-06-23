"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Archive, Trash2 } from "lucide-react";
import DailyMissions from "@/features/dashboard/components/DailyMissions";
import BackOfficeInboxPanel from "@/features/backoffice/components/BackOfficeInboxPanel";
import MobileHubLayout from "@/features/dashboard/components/MobileHubLayout";
import MobileMapWebGLPlaceholder from "@/features/map/components/MobileMapWebGLPlaceholder";
import { useMapHubMissions } from "@/features/map/hooks/useMapHubMissions";
import { useMobileMapPagePowerGate } from "@/features/dashboard/hooks/useMobileMapPagePowerGate";
import { useBackofficeInboxIntentOptional } from "@/context/BackofficeInboxIntentContext";
import { useTranslation } from "@/core/i18n/I18nContext";

/**
 * Hub carte mobile sans Mapbox — évite le chargement du bundle WebGL (test batterie / perf).
 * Réactiver la carte via feature flag `mobileMapWebGL` (mode ultra).
 */
export default function MobileMapHubLite() {
  const { t } = useTranslation();
  const inboxIntent = useBackofficeInboxIntentOptional();
  const powerGate = useMobileMapPagePowerGate(inboxIntent?.activeInboxTab);
  const mapHubDataActive = powerGate.mapHubDataActive;

  const {
    visibleMissions,
    selectedMission,
    setSelectedMission,
    handleArchiveMission,
    handleDeleteMission,
    handleMissionClick,
  } = useMapHubMissions({ mapHubDataActive });

  return (
    <MobileHubLayout
      rootTestId="mobile-map-triple"
      leftLabel={String(t("map.mobile.rail_missions"))}
      centerLabel={String(t("map.mobile.rail_map"))}
      rightLabel={String(t("map.mobile.rail_inbox"))}
      panelPadding={false}
      sideScroll={false}
      left={
        <DailyMissions missions={visibleMissions} onMissionClick={handleMissionClick} isEmbedded />
      }
      center={
        <div id="map-container" className="relative flex h-full min-h-0 flex-col">
          <MobileMapWebGLPlaceholder
            missions={visibleMissions}
            onMissionClick={handleMissionClick}
          />
          <AnimatePresence>
            {selectedMission ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-50 flex min-h-0 items-start justify-center overflow-y-auto overscroll-y-contain bg-black/55 p-4 pb-8 pt-[max(1rem,env(safe-area-inset-top))] pointer-events-auto backdrop-blur-sm"
              >
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 16 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 16 }}
                  className="relative mx-auto w-full max-w-lg rounded-3xl border border-white/10 bg-slate-900/95 px-5 py-6 text-white shadow-2xl"
                >
                  <button
                    type="button"
                    onClick={() => setSelectedMission(null)}
                    className="absolute right-2 top-2 flex h-11 w-11 items-center justify-center rounded-full text-lg text-white/80 transition-colors hover:bg-white/10 active:bg-white/20"
                    aria-label={String(t("common.close"))}
                  >
                    ×
                  </button>
                  <h2 className="pr-12 text-xl font-bold leading-tight">
                    {selectedMission.clientName}
                  </h2>
                  <p className="mt-1.5 text-[13px] font-medium text-white/60">
                    {selectedMission.time}
                  </p>
                  {selectedMission.phone ? (
                    <a
                      href={`tel:${selectedMission.phone}`}
                      className="mt-4 inline-flex min-h-[2.75rem] items-center rounded-xl bg-blue-500/10 px-3 text-[15px] font-semibold text-blue-300 transition-colors hover:bg-blue-500/15 active:bg-blue-500/20"
                    >
                      {selectedMission.phone}
                    </a>
                  ) : null}
                  {selectedMission.address ? (
                    <p className="mt-3 text-[13px] leading-relaxed text-white/75">
                      {selectedMission.address}
                    </p>
                  ) : null}
                  <div className="mt-6 flex justify-center gap-3">
                    <button
                      type="button"
                      onClick={() => handleArchiveMission(selectedMission)}
                      className="flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white/80 transition-colors hover:bg-white/15 active:bg-white/20"
                      aria-label={String(t("map.daily_missions.archive_aria"))}
                    >
                      <Archive className="h-4 w-4" aria-hidden />
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleDeleteMission(selectedMission)}
                      className="flex h-11 w-11 items-center justify-center rounded-full border border-red-500/30 bg-red-500/10 text-red-400 transition-colors hover:bg-red-500/15 active:bg-red-500/20"
                      aria-label={String(t("map.daily_missions.delete_aria"))}
                    >
                      <Trash2 className="h-4 w-4" aria-hidden />
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      }
      right={
        <BackOfficeInboxPanel
          dayMissions={visibleMissions}
          inboxDataActive={powerGate.inboxDataActive}
        />
      }
    />
  );
}
