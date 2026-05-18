"use client";

import { useMemo } from "react";
import { ListTodo, RefreshCw, Wifi, WifiOff } from "lucide-react";
import { GLASS_PANEL_BODY_SCROLL_COMPACT } from "@/core/ui/glassPanelChrome";
import { useOfflineSync } from "@/context/OfflineSyncContext";
import { useTranslation } from "@/core/i18n/I18nContext";
import { useFeatureFlag } from "@/core/useFeatureFlags";
import { readTerrainMissionsCache } from "@/features/offline/terrainMissionsCache";
import { useTechnicianAssignments } from "@/features/interventions/useTechnicianAssignments";

const outfit = { fontFamily: "'Outfit', sans-serif" } as const;

/** Page dédiée : rappels hors ligne + actions de synchro (carousel). */
export default function TechnicianOfflineSyncPanel() {
  const { t } = useTranslation();
  const pwaV2 = useFeatureFlag("pwaV2Bundle");
  const { firebaseUid } = useTechnicianAssignments();
  const { navigatorOnline, pendingCompletionCount, isSyncing, lastFlushReport, flushNow } =
    useOfflineSync();

  const cachedMissions = useMemo(
    () => (firebaseUid ? readTerrainMissionsCache(firebaseUid) : []),
    [firebaseUid, navigatorOnline],
  );

  const hadConflictSkip = (lastFlushReport?.skippedConflict ?? 0) > 0;

  return (
    <div data-testid="technician-offline-sync-panel" style={outfit} className={`${GLASS_PANEL_BODY_SCROLL_COMPACT} flex flex-col gap-3`}>
      <h2 className="sr-only">{t("offline.sync.title_sr")}</h2>

      {hadConflictSkip ? (
        <div
          data-testid="offline-sync-conflict-notice"
          className="rounded-[14px] border border-amber-200/80 bg-amber-50/90 px-3 py-2.5 text-[12px] font-medium leading-snug text-amber-900"
          role="status"
        >
          {lastFlushReport!.skippedConflict === 1
            ? t("offline.sync.conflict_single")
            : t("offline.sync.conflict_multiple").replace("{n}", String(lastFlushReport!.skippedConflict))}{" "}
          {t("offline.sync.conflict_suffix")}
        </div>
      ) : null}

      <div className="rounded-[16px] border border-black/[0.06] bg-white/90 px-3 py-3 shadow-[0_14px_36px_-18px_rgba(15,23,42,0.14)]">
        <ul className="space-y-3 text-[13px] font-semibold text-slate-800">
          <li
            className="flex items-center justify-between gap-4"
            aria-label={navigatorOnline ? t("offline.sync.network_online_aria") : t("offline.sync.network_offline_aria")}
          >
            {navigatorOnline ? (
              <Wifi className="h-5 w-5 shrink-0 text-emerald-600" aria-hidden />
            ) : (
              <WifiOff className="h-5 w-5 shrink-0 text-amber-600" aria-hidden />
            )}
            <span data-testid="offline-sync-network-label" className="sr-only">
              {navigatorOnline ? t("offline.sync.online") : t("offline.sync.offline")}
            </span>
            <span
              className={`h-2.5 w-2.5 shrink-0 rounded-full ${navigatorOnline ? "bg-emerald-500" : "bg-amber-500"}`}
              aria-hidden
            />
          </li>
          <li
            className="flex items-center justify-between gap-4"
            aria-label={`Interventions en attente d&apos;envoi : ${pendingCompletionCount}`}
          >
            <ListTodo className="h-5 w-5 shrink-0 text-slate-500" aria-hidden />
            <span data-testid="offline-sync-queue-count" className="tabular-nums text-slate-900">
              {pendingCompletionCount}
            </span>
          </li>
          <li
            className="flex items-center justify-between gap-4"
            aria-label={isSyncing ? t("offline.sync.syncing_aria") : t("offline.sync.idle_aria")}
          >
            <RefreshCw className={`h-5 w-5 shrink-0 text-slate-500 ${isSyncing ? "animate-spin" : ""}`} aria-hidden />
            <span data-testid="offline-sync-sync-label" className="sr-only">
              {isSyncing ? t("offline.sync.syncing") : t("offline.sync.idle")}
            </span>
            <span className="tabular-nums text-slate-600" aria-hidden>
              {isSyncing ? "…" : "—"}
            </span>
          </li>
        </ul>
      </div>

      {pwaV2 ? (
        <div
          data-testid="offline-terrain-cache-panel"
          className="rounded-[16px] border border-black/[0.06] bg-white/90 px-3 py-3 text-[12px] text-slate-700"
        >
          <p className="mb-1 font-bold text-slate-900">{t("offline.sync.terrain_cache_title")}</p>
          {cachedMissions.length === 0 ? (
            <p data-testid="offline-terrain-cache-empty">{t("offline.sync.terrain_cache_empty")}</p>
          ) : (
            <>
              <p data-testid="offline-terrain-cache-count">
                {t("offline.sync.terrain_cache_count").replace("{count}", String(cachedMissions.length))}
              </p>
              <ul className="mt-2 max-h-28 space-y-1 overflow-y-auto">
                {cachedMissions.slice(0, 8).map((m) => (
                  <li key={m.id} className="truncate rounded-md bg-slate-50 px-2 py-1">
                    {m.title || m.problem || m.id}
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      ) : null}

      <button
        type="button"
        data-testid="offline-sync-flush-btn"
        disabled={!navigatorOnline || isSyncing || pendingCompletionCount === 0}
        onClick={() => void flushNow()}
        aria-label={t("offline.sync.flush_aria")}
        className="flex min-h-[48px] items-center justify-center rounded-[16px] bg-slate-900 px-4 shadow-lg transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
      >
        <RefreshCw className={`h-5 w-5 text-white ${isSyncing ? "animate-spin" : ""}`} aria-hidden />
        <span className="sr-only">{t("offline.sync.flush_sr")}</span>
      </button>
    </div>
  );
}
