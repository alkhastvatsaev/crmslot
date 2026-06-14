"use client";

import React, { useEffect, useState } from "react";
import { Command } from "cmdk";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  DASHBOARD_PANEL_CHROME_BLUR,
  DASHBOARD_PANEL_CHROME_BORDER,
  DASHBOARD_PANEL_CHROME_ROUNDED,
  DASHBOARD_PANEL_INNER_CLIP_CLASS,
  DASHBOARD_PANEL_SHADOW_CLASS,
  GLASS_PANEL_OVERFLOW_PADDING,
} from "@/core/ui/glassPanelChrome";
import { dashboardHeaderPanelShellClass } from "@/core/ui/dashboardDesktopLayout";
import { useTranslation } from "@/core/i18n/I18nContext";

export default function SpotlightSearch({ compact = false }: { compact?: boolean }) {
  const [open, setOpen] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  return (
    <>
      <button
        id="spotlight-search"
        data-testid="spotlight-trigger"
        type="button"
        onClick={() => setOpen(true)}
        aria-label={t("spotlight.open_aria")}
        className={
          compact
            ? "mobile-header-chip mobile-header-chip--interactive w-full justify-between font-medium text-slate-500"
            : `${dashboardHeaderPanelShellClass} items-center justify-between bg-white/95 px-6 font-semibold text-gray-900/60 hover:bg-white hover:text-gray-900 group`
        }
      ></button>

      <AnimatePresence>
        {open && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 pt-[20vh]">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-900/10 backdrop-blur-sm"
              onClick={() => setOpen(false)}
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.98, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: -10 }}
              className={`relative flex min-h-[min(28vh,240px)] max-h-[min(92vh,860px)] w-full max-w-xl flex-col ${DASHBOARD_PANEL_CHROME_ROUNDED} ${DASHBOARD_PANEL_CHROME_BORDER} bg-white/75 ${DASHBOARD_PANEL_SHADOW_CLASS} ${DASHBOARD_PANEL_CHROME_BLUR}`}
            >
              <Command
                className={`flex min-h-0 w-full flex-1 flex-col ${DASHBOARD_PANEL_INNER_CLIP_CLASS}`}
              >
                <div className="flex items-center px-8 border-b border-black/5 bg-white/50 backdrop-blur-md z-10">
                  <Command.Input
                    autoFocus
                    placeholder={t("spotlight.search_placeholder")}
                    className="flex h-[70px] w-full bg-transparent text-gray-800 placeholder:text-gray-400 focus:outline-none text-[20px] font-medium"
                  />
                  <X
                    className="w-5 h-5 opacity-30 cursor-pointer hover:opacity-60 transition-opacity shrink-0"
                    onClick={() => setOpen(false)}
                  />
                </div>

                <Command.List
                  className={`${GLASS_PANEL_OVERFLOW_PADDING} min-h-[80px] max-h-[min(32vh,220px)] flex-1 overflow-y-auto`}
                >
                  <Command.Empty className="px-6 py-8 text-center text-gray-500/60 font-medium">
                    {t("spotlight.no_results")}
                  </Command.Empty>
                </Command.List>
              </Command>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
