"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Archive, Trash2 } from "lucide-react";
import { useTranslation } from "@/core/i18n/I18nContext";
import type { Mission } from "@/features/map/missionTypes";

type Props = {
  mission: Mission | null;
  onClose: () => void;
  onArchive: (mission: Mission) => void;
  onDelete: (mission: Mission) => void;
  variant: "compact" | "desktop";
};

export default function MapMissionSelectedOverlay({
  mission,
  onClose,
  onArchive,
  onDelete,
  variant,
}: Props) {
  const { t } = useTranslation();

  if (!mission) return null;

  if (variant === "compact") {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 z-50 flex min-h-0 items-start justify-center overflow-y-auto overscroll-y-contain bg-gradient-to-b from-transparent to-black/60 p-3 pb-8 pt-[max(0.75rem,env(safe-area-inset-top))] pointer-events-auto"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="relative mx-auto mb-6 mt-1 w-full max-w-lg shrink-0 rounded-2xl border border-white/10 bg-black/25 px-4 py-6 shadow-lg backdrop-blur-md"
        >
          <OverlayCloseButton onClose={onClose} className="right-1 top-1" />
          <div className="w-full pt-1 pr-10 text-center text-white">
            <h2 className="break-words text-2xl font-bold text-white">{mission.clientName}</h2>
            <div className="mt-3 flex flex-wrap items-center justify-center gap-2 text-base text-white/90">
              <span className="rounded-full bg-white/20 px-3 py-1 font-semibold">
                {mission.status}
              </span>
              <span className="font-medium">{mission.time}</span>
            </div>
            {mission.phone ? (
              <a
                href={`tel:${mission.phone}`}
                className="mt-4 block text-lg font-medium text-blue-300"
              >
                {mission.phone}
              </a>
            ) : null}
            {mission.address ? (
              <p className="mt-2 text-base text-white/80">{mission.address}</p>
            ) : null}
            <OverlayActions
              mission={mission}
              onArchive={onArchive}
              onDelete={onDelete}
              className="mt-5"
              buttonClassName="rounded-full border border-white/20 bg-white/10 p-2.5 text-white/60 hover:text-white"
              deleteClassName="rounded-full border border-red-500/30 bg-red-500/10 p-2.5 text-red-400"
            />
          </div>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-50 flex min-h-0 items-start justify-center overflow-y-auto overscroll-y-contain bg-gradient-to-b from-transparent to-black/60 p-3 pb-8 pt-[max(0.75rem,env(safe-area-inset-top))] pointer-events-auto sm:p-5 sm:pb-10"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="relative mx-auto mb-6 mt-1 w-full max-w-2xl shrink-0 rounded-2xl border border-white/10 bg-black/25 px-4 py-6 shadow-lg backdrop-blur-md sm:mb-10 sm:mt-2 sm:px-8 sm:py-8"
      >
        <OverlayCloseButton onClose={onClose} className="right-1 top-1 sm:right-2 sm:top-2" large />
        <div className="w-full pt-1 pr-10 text-center text-white sm:pr-12 sm:pt-2">
          <h2 className="break-words text-2xl font-bold leading-snug tracking-tight text-white sm:text-4xl md:text-5xl">
            {mission.clientName}
          </h2>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-base text-white/90 sm:mt-5 sm:gap-4 sm:text-lg">
            <span className="rounded-full bg-white/20 px-3 py-1 font-semibold sm:px-4 sm:py-1.5">
              {mission.status}
            </span>
            <span className="hidden text-white/40 sm:inline">•</span>
            <span className="font-medium">{mission.time}</span>
          </div>
          <div className="mx-auto mt-6 flex w-full max-w-lg flex-col gap-5 text-left sm:mt-8 sm:gap-7">
            {mission.phone ? (
              <div className="flex min-w-0 flex-col">
                <span className="mb-1 text-xs font-bold uppercase tracking-widest text-white/50 sm:text-sm">
                  {t("map.mission_overlay.phone")}
                </span>
                <a
                  href={`tel:${mission.phone}`}
                  className="break-all text-lg font-medium text-white transition-colors hover:text-blue-400 sm:text-2xl"
                >
                  {mission.phone}
                </a>
              </div>
            ) : null}
            {mission.address ? (
              <div className="flex min-w-0 flex-col">
                <span className="mb-1 text-xs font-bold uppercase tracking-widest text-white/50 sm:text-sm">
                  {t("map.mission_overlay.address")}
                </span>
                <a
                  href={`https://maps.google.com/?q=${encodeURIComponent(mission.address)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-wrap items-start gap-2 text-lg font-medium text-white transition-colors hover:text-blue-400 sm:text-2xl"
                >
                  <span className="min-w-0 break-words">{mission.address}</span>
                  <svg
                    className="mt-0.5 h-4 w-4 shrink-0 text-white/50 sm:h-5 sm:w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    aria-hidden
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                    />
                  </svg>
                </a>
              </div>
            ) : null}
            {mission.description ? (
              <div className="flex min-w-0 flex-col">
                <span className="mb-1.5 text-xs font-bold uppercase tracking-widest text-white/50 sm:mb-2 sm:text-sm">
                  {t("map.mission_overlay.problem_description")}
                </span>
                <p className="break-words rounded-2xl border border-white/10 bg-white/10 p-3 text-base !font-medium !text-white leading-relaxed backdrop-blur-sm sm:p-5 sm:text-lg">
                  {mission.description}
                </p>
              </div>
            ) : null}
          </div>
          <OverlayActions
            mission={mission}
            onArchive={onArchive}
            onDelete={onDelete}
            className="mt-6 sm:mt-8"
            buttonClassName="rounded-full border border-white/20 bg-white/[0.06] p-2.5 text-white/50 shadow-sm transition hover:border-white/35 hover:bg-white/10 hover:text-white/85"
            deleteClassName="rounded-full border border-red-500/30 bg-red-500/10 p-2.5 text-red-400/70 shadow-sm transition hover:border-red-500/50 hover:bg-red-500/20 hover:text-red-300"
          />
        </div>
      </motion.div>
    </motion.div>
  );
}

function OverlayCloseButton({
  onClose,
  className,
  large,
}: {
  onClose: () => void;
  className: string;
  large?: boolean;
}) {
  const { t } = useTranslation();
  return (
    <button
      type="button"
      onClick={onClose}
      className={`absolute z-50 rounded-full p-2 text-white hover:bg-white/10 ${className}`}
      aria-label={String(t("common.close"))}
    >
      <svg
        className={large ? "h-6 w-6 sm:h-8 sm:w-8" : "h-6 w-6"}
        fill="none"
        viewBox="0 0 24 24"
        stroke="#ffffff"
        aria-hidden
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2.5}
          d="M6 18L18 6M6 6l12 12"
        />
      </svg>
    </button>
  );
}

function OverlayActions({
  mission,
  onArchive,
  onDelete,
  className,
  buttonClassName,
  deleteClassName,
}: {
  mission: Mission;
  onArchive: (mission: Mission) => void;
  onDelete: (mission: Mission) => void;
  className: string;
  buttonClassName: string;
  deleteClassName: string;
}) {
  const { t } = useTranslation();
  return (
    <div className={`flex justify-center gap-4 ${className}`}>
      <button
        type="button"
        onClick={() => onArchive(mission)}
        aria-label={String(t("map.daily_missions.archive_aria"))}
        title={String(t("map.daily_missions.archive_aria"))}
        className={buttonClassName}
      >
        <Archive className="h-4 w-4" strokeWidth={2} aria-hidden />
      </button>
      <button
        type="button"
        onClick={() => onDelete(mission)}
        aria-label={String(t("map.daily_missions.delete_aria"))}
        title={String(t("map.daily_missions.delete_aria"))}
        className={deleteClassName}
      >
        <Trash2 className="h-4 w-4" strokeWidth={2} aria-hidden />
      </button>
    </div>
  );
}
