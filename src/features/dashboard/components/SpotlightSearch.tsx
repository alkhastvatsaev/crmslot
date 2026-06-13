"use client";
import React, { useEffect, useMemo, useState } from "react";
import { Command } from "cmdk";
import {
  X,
  Globe,
  Map,
  Building2,
  Wrench,
  Mail,
  Package,
  Sparkles,
  Receipt,
  BrainCircuit,
} from "lucide-react";
import { DASHBOARD_CAROUSEL_PAGES } from "@/features/dashboard/dashboardCarouselRegistry";
import { useDashboardPagerOptional } from "@/features/dashboard/dashboardPagerContext";
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
import { useTranslation, Language } from "@/core/i18n/I18nContext";

const languages: { code: Language; label: string }[] = [
  { code: "fr", label: "FR" },
  { code: "en", label: "EN" },
  { code: "nl", label: "NL" },
];

const SPOTLIGHT_NAV_ICONS = {
  "spotlight.nav_map": Map,
  "spotlight.nav_company": Building2,
  "spotlight.nav_technician": Wrench,
  "spotlight.nav_gmail": Mail,
  "spotlight.nav_feature_hub": Package,
  "spotlight.nav_crm_history": Sparkles,
  "spotlight.nav_billing_hub": Receipt,
  "spotlight.nav_offline": BrainCircuit,
} as const;

export default function SpotlightSearch({ compact = false }: { compact?: boolean }) {
  const [open, setOpen] = useState(false);
  const { language, setLanguage, t } = useTranslation();
  const pager = useDashboardPagerOptional();
  const navPages = useMemo(
    () =>
      DASHBOARD_CAROUSEL_PAGES.map((page) => ({
        index: page.slotIndex,
        label: t(page.spotlightLabelKey),
        Icon: SPOTLIGHT_NAV_ICONS[page.spotlightLabelKey],
      })),
    [t]
  );

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
              className={`relative flex min-h-[min(58vh,520px)] max-h-[min(92vh,860px)] w-full max-w-xl flex-col ${DASHBOARD_PANEL_CHROME_ROUNDED} ${DASHBOARD_PANEL_CHROME_BORDER} bg-white/75 ${DASHBOARD_PANEL_SHADOW_CLASS} ${DASHBOARD_PANEL_CHROME_BLUR}`}
            >
              <Command
                className={`flex min-h-0 w-full flex-1 flex-col ${DASHBOARD_PANEL_INNER_CLIP_CLASS}`}
              >
                {/* Header: Search Input & Close */}
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

                {/* Sub-header: Premium Language Selector */}
                <div className="flex items-center justify-between px-6 py-2 border-b border-black/5 bg-slate-50/40 backdrop-blur-md">
                  <div className="flex items-center gap-2 text-sm text-gray-400 font-medium px-2">
                    <Globe className="w-4 h-4 opacity-70" />
                    <span className="hidden sm:inline">Langue / Language / Taal</span>
                  </div>

                  {/* Apple Segmented Control Style */}
                  <div className="relative flex items-center p-1 bg-black/[0.04] rounded-full shadow-inner">
                    {languages.map((lang) => (
                      <button
                        key={lang.code}
                        onClick={() => setLanguage(lang.code)}
                        className={`relative z-10 px-5 py-1.5 text-sm font-bold transition-colors duration-200 rounded-full ${
                          language === lang.code
                            ? "text-gray-900"
                            : "text-gray-500 hover:text-gray-700"
                        }`}
                      >
                        {language === lang.code && (
                          <motion.div
                            layoutId="active-language"
                            className="absolute inset-0 bg-white rounded-full shadow-[0_2px_8px_rgba(0,0,0,0.08)]"
                            initial={false}
                            transition={{ type: "spring", stiffness: 400, damping: 30 }}
                          />
                        )}
                        <span className="relative z-10 tracking-wide">{lang.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <Command.List
                  className={`${GLASS_PANEL_OVERFLOW_PADDING} min-h-[360px] max-h-[min(52vh,440px)] flex-1 overflow-y-auto`}
                >
                  <Command.Empty className="px-6 py-8 text-center text-gray-500/60 font-medium">
                    {t("spotlight.no_results")}
                  </Command.Empty>

                  {/* Navigation */}
                  <Command.Group heading={t("spotlight.nav_group_heading")} className="px-2 py-2">
                    {navPages.map((page) => {
                      const isActive = pager?.pageIndex === page.index;
                      return (
                        <Command.Item
                          key={page.index}
                          data-testid={`nav-item-${page.index}`}
                          value={page.label}
                          onSelect={() => {
                            pager?.setPageIndex(page.index);
                            setOpen(false);
                          }}
                          className={`flex cursor-pointer items-center gap-3 rounded-lg px-4 py-2.5 text-sm transition-colors hover:bg-black/5 aria-selected:bg-black/5 ${isActive ? "font-semibold text-gray-900" : "text-gray-600"}`}
                        >
                          <page.Icon className="w-4 h-4 shrink-0 opacity-60" />
                          <span className="flex-1">{page.label}</span>
                          {isActive && (
                            <span className="text-xs text-blue-500 font-medium">
                              {t("spotlight.active_label")}
                            </span>
                          )}
                        </Command.Item>
                      );
                    })}
                  </Command.Group>
                </Command.List>
              </Command>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
