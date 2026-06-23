"use client";

import { ChevronDown, ChevronUp, Mail } from "lucide-react";
import { useTranslation } from "@/core/i18n/I18nContext";

type Props = {
  expanded: boolean;
  unreadCount: number;
  emailCount: number;
  onToggle: () => void;
};

export default function InterventionEmailDefaultHeader({
  expanded,
  unreadCount,
  emailCount,
  onToggle,
}: Props) {
  const { t } = useTranslation();

  return (
    <button
      type="button"
      data-testid="email-panel-toggle"
      onClick={onToggle}
      className="flex w-full items-center justify-between rounded-[14px] bg-slate-50 px-4 py-3 border border-slate-100 hover:bg-slate-100/80 transition-colors"
    >
      <div className="flex items-center gap-2">
        <Mail className="w-4 h-4 text-slate-500" />
        <span className="text-[12px] font-bold text-slate-700 uppercase tracking-widest">
          {t("emails.panel_title")}
        </span>
        {unreadCount > 0 && (
          <span
            data-testid="email-unread-badge"
            className="flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-blue-500 text-[9px] font-bold text-white"
          >
            {unreadCount}
          </span>
        )}
        {emailCount > 0 && unreadCount === 0 && (
          <span className="text-[10px] text-slate-400">{emailCount}</span>
        )}
      </div>
      {expanded ? (
        <ChevronUp className="w-4 h-4 text-slate-400" />
      ) : (
        <ChevronDown className="w-4 h-4 text-slate-400" />
      )}
    </button>
  );
}
