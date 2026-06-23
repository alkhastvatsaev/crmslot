"use client";

import { Mail } from "lucide-react";
import { useTranslation } from "@/core/i18n/I18nContext";
import { cn } from "@/lib/utils";
import type { InterventionEmailDoc } from "@/features/emails/interventionEmailFirestore";
import type { InterventionEmailPatronView } from "@/features/emails/interventionEmailPanelTypes";

type Props = {
  unreadCount: number;
  emailCount: number;
  patronView: InterventionEmailPatronView;
  composing: boolean;
  showCompose: boolean;
  lastInbound: InterventionEmailDoc | undefined;
  onShowThread: () => void;
  onOpenCompose: () => void;
  onReplyToLast: () => void;
};

export default function InterventionEmailPatronMenu({
  unreadCount,
  emailCount,
  patronView,
  composing,
  showCompose,
  lastInbound,
  onShowThread,
  onOpenCompose,
  onReplyToLast,
}: Props) {
  const { t } = useTranslation();

  return (
    <div className="space-y-2" data-testid="case-hub-email-menu">
      <div className="flex items-center justify-between gap-2 px-1">
        <div className="flex items-center gap-2">
          <Mail className="h-4 w-4 text-sky-600" aria-hidden />
          <span className="text-[12px] font-bold text-slate-800">
            {t("caseHub.emails.panel_title")}
          </span>
          {unreadCount > 0 ? (
            <span
              data-testid="case-hub-email-unread"
              className="rounded-full bg-sky-600 px-2 py-0.5 text-[10px] font-bold text-white tabular-nums"
            >
              {unreadCount}
            </span>
          ) : null}
        </div>
        <span className="text-[10px] font-medium text-slate-400 tabular-nums">
          {emailCount} {t("caseHub.emails.message_count")}
        </span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        <button
          type="button"
          data-testid="case-hub-email-menu-thread"
          onClick={onShowThread}
          className={cn(
            "rounded-xl border px-3 py-2 text-[11px] font-semibold transition",
            patronView === "thread" && !composing
              ? "border-sky-300 bg-sky-50 text-sky-900"
              : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
          )}
        >
          {t("caseHub.emails.menu_thread")}
        </button>
        <button
          type="button"
          data-testid="case-hub-email-menu-compose"
          onClick={onOpenCompose}
          className={cn(
            "rounded-xl border px-3 py-2 text-[11px] font-semibold transition",
            showCompose
              ? "border-sky-300 bg-sky-50 text-sky-900"
              : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
          )}
        >
          {t("caseHub.emails.menu_compose")}
        </button>
        <button
          type="button"
          data-testid="case-hub-email-menu-reply"
          disabled={!lastInbound}
          onClick={onReplyToLast}
          className={cn(
            "rounded-xl border px-3 py-2 text-[11px] font-semibold transition disabled:opacity-40",
            "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
          )}
        >
          {t("caseHub.emails.menu_reply")}
        </button>
      </div>
    </div>
  );
}
