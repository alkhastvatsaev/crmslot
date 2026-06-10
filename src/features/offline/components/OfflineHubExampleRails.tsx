"use client";

import { ListTodo, RefreshCw, Wifi } from "lucide-react";
import { useTranslation } from "@/core/i18n/I18nContext";
import {
  OFFLINE_HUB_EXAMPLE_MISSIONS,
  OFFLINE_HUB_EXAMPLE_QUEUE_COUNT,
} from "@/features/offline/offlineHubExample";

export function OfflineHubExampleNetwork() {
  const { t } = useTranslation();

  return (
    <div
      data-testid="offline-hub-example-network"
      className="space-y-3 rounded-[18px] border border-slate-100 bg-white p-4 text-[13px] text-slate-700"
    >
      <div className="flex items-center gap-2 font-semibold text-emerald-700">
        <Wifi className="h-4 w-4" aria-hidden />
        {t("offline.sync.online")}
      </div>
      <p>{t("offline.hub.example_network_hint")}</p>
      <p className="flex items-center gap-2 text-[12px] text-slate-500">
        <ListTodo className="h-4 w-4 shrink-0" aria-hidden />
        {t("offline.hub.queue_label")}:{" "}
        <span className="font-bold tabular-nums text-slate-800">
          {OFFLINE_HUB_EXAMPLE_QUEUE_COUNT}
        </span>
      </p>
    </div>
  );
}

export function OfflineHubExampleCache() {
  const { t } = useTranslation();

  return (
    <div
      data-testid="offline-hub-example-cache"
      className="rounded-[18px] border border-slate-100 bg-white p-4 text-[13px] text-slate-700"
    >
      <p
        data-testid="offline-hub-example-cache-count"
        className="mb-2 font-semibold text-slate-900"
      >
        {t("offline.sync.terrain_cache_count").replace(
          "{count}",
          String(OFFLINE_HUB_EXAMPLE_MISSIONS.length)
        )}
      </p>
      <ul className="max-h-48 space-y-1 overflow-y-auto">
        {OFFLINE_HUB_EXAMPLE_MISSIONS.map((m) => (
          <li
            key={m.id}
            data-testid={`offline-hub-example-mission-${m.id}`}
            className="rounded-md bg-slate-50 px-2 py-1.5 text-[12px]"
          >
            <span className="font-semibold text-slate-800">{m.title}</span>
            {m.problem ? <span className="mt-0.5 block text-slate-500">{m.problem}</span> : null}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function OfflineHubExampleSyncHint() {
  const { t } = useTranslation();

  return (
    <div
      data-testid="offline-hub-example-sync-hint"
      className="mb-3 rounded-[14px] border border-dashed border-slate-200 bg-slate-50/90 px-3 py-2.5 text-[12px] text-slate-600"
    >
      <RefreshCw className="mb-1 inline h-3.5 w-3.5 text-slate-400" aria-hidden />{" "}
      {t("offline.hub.example_sync_hint")}
    </div>
  );
}
