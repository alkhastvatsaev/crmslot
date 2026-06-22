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
                className="absolute inset-0 z-50 flex min-h-0 items-start justify-center overflow-y-auto overscroll-y-contain bg-black/50 p-3 pb-8 pt-[max(0.75rem,env(safe-area-inset-top))] pointer-events-auto"
              >
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 16 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 16 }}
                  className="relative mx-auto w-full max-w-lg rounded-2xl border border-white/10 bg-slate-900/95 px-4 py-6 text-white shadow-xl"
                >
                  <button
                    type="button"
                    onClick={() => setSelectedMission(null)}
                    className="absolute right-2 top-2 rounded-full p-2 text-white/80 hover:bg-white/10"
                    aria-label={String(t("common.close"))}
                  >
                    ×
                  </button>
                  <h2 className="pr-8 text-xl font-bold">{selectedMission.clientName}</h2>
                  <p className="mt-2 text-sm text-white/70">{selectedMission.time}</p>
                  {selectedMission.phone ? (
                    <a
                      href={`tel:${selectedMission.phone}`}
                      className="mt-3 block text-base text-blue-300"
                    >
                      {selectedMission.phone}
                    </a>
                  ) : null}
                  {selectedMission.address ? (
                    <p className="mt-2 text-sm text-white/80">{selectedMission.address}</p>
                  ) : null}
                  <div className="mt-5 flex justify-center gap-3">
                    <button
                      type="button"
                      onClick={() => handleArchiveMission(selectedMission)}
                      className="rounded-full border border-white/20 bg-white/10 p-2.5 text-white/70"
                      aria-label={String(t("map.daily_missions.archive_aria"))}
                    >
                      <Archive className="h-4 w-4" aria-hidden />
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleDeleteMission(selectedMission)}
                      className="rounded-full border border-red-500/30 bg-red-500/10 p-2.5 text-red-400"
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
      right={<BackOfficeInboxPanel dayMissions={visibleMissions} />}
    />
  );
}
