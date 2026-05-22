"use client";

import { useEffect, useMemo } from "react";
import { Command } from "cmdk";
import { Camera, MapPin, Phone, Search, Wrench, X, Mail } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useTranslation } from "@/core/i18n/I18nContext";
import type { Intervention } from "@/features/interventions/types";
import { capitalizeName, formatAddress } from "@/utils/stringUtils";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  missions: Intervention[];
  selectedCaseId: string | null;
  onSelectCase: (id: string) => void;
  onFinishCase?: (id: string) => void;
};

function missionLabel(iv: Intervention): string {
  const name =
    [iv.clientFirstName, iv.clientLastName].filter(Boolean).join(" ") ||
    iv.clientName ||
    iv.title ||
    iv.id;
  return capitalizeName(name);
}

export default function InterventionCommandPalette({
  open,
  onOpenChange,
  missions,
  selectedCaseId,
  onSelectCase,
  onFinishCase,
}: Props) {
  const { t } = useTranslation();

  const sorted = useMemo(
    () => [...missions].sort((a, b) => (a.scheduledTime || "").localeCompare(b.scheduledTime || "")),
    [missions],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        onOpenChange(!open);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onOpenChange]);

  const close = () => onOpenChange(false);
  const selected = missions.find((m) => m.id === selectedCaseId) ?? null;

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[80] flex items-start justify-center bg-black/40 p-4 pt-[12vh]"
          data-testid="intervention-command-palette-overlay"
          onClick={close}
        >
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.98 }}
            className="w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
            data-testid="intervention-command-palette"
            onClick={(e) => e.stopPropagation()}
          >
            <Command label={t("technician_hub.command_palette.title")} shouldFilter>
              <div className="flex items-center gap-2 border-b border-slate-100 px-3">
                <Search className="h-4 w-4 shrink-0 text-slate-400" />
                <Command.Input
                  data-testid="intervention-command-palette-input"
                  placeholder={t("technician_hub.command_palette.placeholder")}
                  className="h-12 flex-1 bg-transparent text-[15px] outline-none"
                />
                <button
                  type="button"
                  aria-label={t("common.close")}
                  onClick={close}
                  className="rounded-full p-1.5 text-slate-500 hover:bg-slate-100"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <Command.List className="max-h-[min(50vh,360px)] overflow-y-auto p-2">
                <Command.Empty className="px-3 py-6 text-center text-sm text-slate-500">
                  {t("technician_hub.command_palette.empty")}
                </Command.Empty>
                <Command.Group heading={t("technician_hub.command_palette.missions")}>
                  {sorted.map((iv) => (
                    <Command.Item
                      key={iv.id}
                      value={`${missionLabel(iv)} ${iv.address} ${iv.status}`}
                      data-testid={`command-palette-mission-${iv.id}`}
                      onSelect={() => {
                        onSelectCase(iv.id);
                        close();
                      }}
                      className="flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 aria-selected:bg-slate-100"
                    >
                      <Wrench className="h-4 w-4 shrink-0 text-blue-600" />
                      <div className="min-w-0 flex-1 text-left">
                        <div className="truncate text-[14px] font-bold text-slate-900">
                          {missionLabel(iv)}
                        </div>
                        <div className="truncate text-[11px] text-slate-500">
                          {iv.scheduledTime || "—"} · {iv.status}
                        </div>
                      </div>
                      {iv.id === selectedCaseId ? (
                        <span className="text-[10px] font-bold uppercase text-blue-600">
                          {t("technician_hub.command_palette.active")}
                        </span>
                      ) : null}
                    </Command.Item>
                  ))}
                </Command.Group>
                {selected ? (
                  <Command.Group heading={t("technician_hub.command_palette.actions")}>
                    {selected.clientPhone || selected.phone ? (
                      <Command.Item
                        value="call client phone"
                        data-testid="command-palette-action-call"
                        onSelect={() => {
                          window.location.href = `tel:${selected.clientPhone || selected.phone}`;
                          close();
                        }}
                        className="flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 aria-selected:bg-slate-100"
                      >
                        <Phone className="h-4 w-4 text-blue-600" />
                        <span className="text-[14px] font-semibold">{t("common.call")}</span>
                      </Command.Item>
                    ) : null}
                    {selected.clientEmail ? (
                      <Command.Item
                        value="email client"
                        data-testid="command-palette-action-email"
                        onSelect={() => {
                          window.location.href = `mailto:${selected.clientEmail}`;
                          close();
                        }}
                        className="flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 aria-selected:bg-slate-100"
                      >
                        <Mail className="h-4 w-4 text-orange-600" />
                        <span className="text-[14px] font-semibold">Mail</span>
                      </Command.Item>
                    ) : null}
                    {selected.address ? (
                      <Command.Item
                        value="navigate maps"
                        data-testid="command-palette-action-navigate"
                        onSelect={() => {
                          const url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(formatAddress(selected.address))}`;
                          window.open(url, "_blank", "noopener,noreferrer");
                          close();
                        }}
                        className="flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 aria-selected:bg-slate-100"
                      >
                        <MapPin className="h-4 w-4 text-emerald-600" />
                        <span className="text-[14px] font-semibold">{t("common.navigate")}</span>
                      </Command.Item>
                    ) : null}
                    {selected.status === "in_progress" && onFinishCase ? (
                      <Command.Item
                        value="finish job"
                        data-testid="command-palette-action-finish"
                        onSelect={() => {
                          onFinishCase(selected.id);
                          close();
                        }}
                        className="flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 aria-selected:bg-slate-100"
                      >
                        <Camera className="h-4 w-4 text-purple-600" />
                        <span className="text-[14px] font-semibold">{t("common.finish")}</span>
                      </Command.Item>
                    ) : null}
                  </Command.Group>
                ) : null}
              </Command.List>
            </Command>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
