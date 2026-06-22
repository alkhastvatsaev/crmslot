"use client";

import React from "react";
import { motion } from "framer-motion";
import { useTranslation } from "@/core/i18n/I18nContext";
import {
  DASHBOARD_PANEL_INNER_CLIP_CLASS,
  GLASS_PANEL_BODY_SCROLL_COMPACT,
} from "@/core/ui/glassPanelChrome";
import {
  MAP_TRANSCRIPTION_PANEL_SHELL,
  type MapTranscriptionFormState,
} from "@/features/map/mapTranscriptionActionsTypes";

type Props = {
  railScreenRect: { left: number; width: number } | null;
  form: MapTranscriptionFormState;
  setForm: React.Dispatch<React.SetStateAction<MapTranscriptionFormState>>;
  busy: null | "refuse" | "create";
  isValid: boolean;
  onSupprimer: () => void;
  onCreate: () => void;
};

export default function MapTranscriptionEditPanel({
  railScreenRect,
  form,
  setForm,
  busy,
  isValid,
  onSupprimer,
  onCreate,
}: Props) {
  const { t } = useTranslation();

  return (
    <motion.div
      data-testid="map-transcription-edit"
      key="map-transcription-edit"
      initial={{ opacity: 0, y: 18, scale: 0.99 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 18, scale: 0.99 }}
      transition={{ type: "spring", stiffness: 420, damping: 34, mass: 0.8 }}
      className={
        railScreenRect
          ? MAP_TRANSCRIPTION_PANEL_SHELL
          : `${MAP_TRANSCRIPTION_PANEL_SHELL} left-6 w-[min(var(--dashboard-rail-max-width),calc(100vw-1.5rem))] min-w-[var(--dashboard-rail-min-width)]`
      }
      style={
        railScreenRect
          ? {
              left: railScreenRect.left,
              width: railScreenRect.width,
              top: "50%",
              transform: "translateY(-50%)",
            }
          : undefined
      }
    >
      <div className={DASHBOARD_PANEL_INNER_CLIP_CLASS}>
        <div className={`${GLASS_PANEL_BODY_SCROLL_COMPACT} grid grid-cols-2 gap-3 pr-2`}>
          <label className="col-span-2">
            <div className="mb-1 text-[11px] font-bold text-slate-700">
              {t("map.transcription.address")}
            </div>
            <input
              data-testid="edit-address"
              value={form.address}
              onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))}
              className="h-10 w-full rounded-xl border border-black/10 bg-white px-3 text-sm font-semibold text-slate-900 outline-none focus:ring-2 focus:ring-black/10"
            />
          </label>

          <label>
            <div className="mb-1 text-[11px] font-bold text-slate-700">
              {t("map.transcription.client_name")}
            </div>
            <input
              data-testid="edit-clientName"
              value={form.clientName}
              onChange={(e) => setForm((p) => ({ ...p, clientName: e.target.value }))}
              className="h-10 w-full rounded-xl border border-black/10 bg-white px-3 text-sm font-semibold text-slate-900 outline-none focus:ring-2 focus:ring-black/10"
            />
          </label>

          <label>
            <div className="mb-1 text-[11px] font-bold text-slate-700">
              {t("map.transcription.phone")}
            </div>
            <input
              data-testid="edit-phone"
              value={form.phone}
              onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
              className="h-10 w-full rounded-xl border border-black/10 bg-white px-3 text-sm font-semibold text-slate-900 outline-none focus:ring-2 focus:ring-black/10"
            />
          </label>

          <label className="col-span-2">
            <div className="mb-1 text-[11px] font-bold text-slate-700">
              {t("map.transcription.problem")}
            </div>
            <input
              data-testid="edit-problem"
              value={form.problem}
              onChange={(e) => setForm((p) => ({ ...p, problem: e.target.value }))}
              className="h-10 w-full rounded-xl border border-black/10 bg-white px-3 text-sm font-semibold text-slate-900 outline-none focus:ring-2 focus:ring-black/10"
            />
          </label>

          <label>
            <div className="mb-1 text-[11px] font-bold text-slate-700">
              {t("map.transcription.date")}
            </div>
            <input
              data-testid="edit-date"
              type="date"
              value={form.date}
              onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))}
              className="h-10 w-full rounded-xl border border-black/10 bg-white px-3 text-sm font-semibold text-slate-900 outline-none focus:ring-2 focus:ring-black/10"
            />
          </label>

          <label>
            <div className="mb-1 text-[11px] font-bold text-slate-700">
              {t("map.transcription.time")}
            </div>
            <input
              data-testid="edit-time"
              type="time"
              value={form.time}
              onChange={(e) => setForm((p) => ({ ...p, time: e.target.value }))}
              className="h-10 w-full rounded-xl border border-black/10 bg-white px-3 text-sm font-semibold text-slate-900 outline-none focus:ring-2 focus:ring-black/10"
            />
          </label>

          <label className="col-span-2 flex items-center gap-2 pt-1">
            <input
              data-testid="edit-urgency"
              type="checkbox"
              checked={form.urgency}
              onChange={(e) => setForm((p) => ({ ...p, urgency: e.target.checked }))}
            />
            <span className="text-sm font-bold text-slate-800">
              {t("map.transcription.urgency")}
            </span>
          </label>
        </div>

        <div className="mt-auto flex w-full shrink-0 gap-3 border-t border-black/10 px-4 pb-5 pt-4">
          <button
            type="button"
            data-testid="edit-delete"
            onClick={() => void onSupprimer()}
            disabled={busy !== null}
            className="flex h-12 min-w-0 flex-1 items-center justify-center rounded-xl bg-red-600 text-sm font-bold text-white shadow-[0_10px_26px_-6px_rgba(220,38,38,0.45)] transition hover:bg-red-700 disabled:opacity-50"
          >
            {t("common.delete")}
          </button>
          <button
            type="button"
            data-testid="edit-create"
            onClick={() => void onCreate()}
            disabled={busy !== null || !isValid}
            className="flex h-12 min-w-0 flex-1 items-center justify-center rounded-xl bg-emerald-600 text-sm font-bold text-white shadow-[0_12px_28px_-6px_rgba(16,185,129,0.42)] transition hover:bg-emerald-700 disabled:opacity-50"
          >
            Créer
          </button>
        </div>
      </div>
    </motion.div>
  );
}
