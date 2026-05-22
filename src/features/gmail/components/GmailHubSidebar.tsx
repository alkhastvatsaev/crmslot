"use client";

import { LogOut, MailPlus, RefreshCw } from "lucide-react";
import { useTranslation } from "@/core/i18n/I18nContext";
import { cn } from "@/lib/utils";
import { GMAIL_HUB_SYSTEM_LABELS } from "@/features/gmail/gmailHubConstants";
import GmailHubAvatar from "@/features/gmail/components/GmailHubAvatar";
import {
  gmailDivider,
  gmailEyebrow,
  gmailGhostBtn,
  gmailHubFont,
  gmailPrimaryBtn,
  gmailShell,
  LABEL_ICONS,
} from "@/features/gmail/gmailHubUi";
import type { GmailHubLabel } from "@/features/gmail/gmailHubTypes";

type Props = {
  email: string;
  activeLabelId: string;
  allLabels: GmailHubLabel[];
  userLabels: GmailHubLabel[];
  onSelectLabel: (id: string) => void;
  onCompose: () => void;
  onRefreshLabels: () => void;
  onDisconnect: () => void;
};

export default function GmailHubSidebar({
  email,
  activeLabelId,
  allLabels,
  userLabels,
  onSelectLabel,
  onCompose,
  onRefreshLabels,
  onDisconnect,
}: Props) {
  const labelUnread = (id: string) =>
    allLabels.find((l) => l.id === id)?.messagesUnread ?? 0;
  const { t } = useTranslation();

  return (
    <div className={gmailShell} data-testid="gmail-hub-panel-left" style={gmailHubFont}>
      <div className={`shrink-0 border-b ${gmailDivider} px-4 pb-4 pt-3`}>
        <div className="flex items-center gap-3">
          <GmailHubAvatar seed={email} size="md" />
          <div className="min-w-0 flex-1">
            <p className="mt-0.5 truncate text-[13px] font-medium text-slate-800" title={email}>
              {email}
            </p>
          </div>
          <button
            type="button"
            data-testid="gmail-hub-disconnect-btn"
            onClick={onDisconnect}
            className={gmailGhostBtn}
            title={String(t("gmail.hub.disconnect"))}
            aria-label={String(t("gmail.hub.disconnect"))}
          >
            <LogOut className="h-4 w-4" strokeWidth={1.5} />
          </button>
        </div>
        <button
          type="button"
          data-testid="gmail-hub-compose-btn"
          onClick={onCompose}
          className={`${gmailPrimaryBtn} mt-4 w-full`}
        >
          <MailPlus className="h-3.5 w-3.5" strokeWidth={1.75} />
          {t("gmail.hub.compose")}
        </button>
      </div>

      <nav
        className="min-h-0 flex-1 overflow-y-auto px-2.5 py-3 custom-scrollbar"
        data-testid="gmail-hub-labels"
      >
        <p className={`mb-2 px-2 ${gmailEyebrow}`}>{t("gmail.hub.folders")}</p>
        {GMAIL_HUB_SYSTEM_LABELS.map((item) => {
          const Icon = LABEL_ICONS[item.id] ?? MailPlus;
          const active = activeLabelId === item.id;
          return (
            <button
              key={item.id}
              type="button"
              data-testid={`gmail-hub-label-${item.id}`}
              onClick={() => onSelectLabel(item.id)}
              className={cn(
                "mb-1 flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-[13px] transition-all",
                active
                  ? "gmail-hub-nav-active font-medium text-slate-900"
                  : "text-slate-600 hover:bg-white/40",
              )}
            >
              <Icon
                className={cn("h-4 w-4 shrink-0", active ? "text-slate-800" : "opacity-55")}
                strokeWidth={1.5}
              />
              <span className="truncate flex-1">{t(item.labelKey)}</span>
              {labelUnread(item.id) > 0 && (
                <span className="shrink-0 rounded-full bg-slate-900/90 px-1.5 py-0.5 text-[10px] font-medium tabular-nums text-white">
                  {labelUnread(item.id)}
                </span>
              )}
            </button>
          );
        })}
        {userLabels.length > 0 ? (
          <p className={`mb-2 mt-5 px-2 ${gmailEyebrow}`}>{t("gmail.hub.user_labels")}</p>
        ) : null}
        {userLabels.map((label) => {
          const active = activeLabelId === label.id;
          return (
            <button
              key={label.id}
              type="button"
              data-testid={`gmail-hub-label-${label.id}`}
              onClick={() => onSelectLabel(label.id)}
              className={cn(
                "mb-1 flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-left text-[13px] transition-all",
                active
                  ? "gmail-hub-nav-active font-medium text-slate-900"
                  : "text-slate-600 hover:bg-white/40",
              )}
            >
              <span className="truncate">{label.name}</span>
              {label.messagesUnread > 0 ? (
                <span className="shrink-0 rounded-full bg-slate-900/90 px-1.5 py-0.5 text-[10px] font-medium tabular-nums text-white">
                  {label.messagesUnread}
                </span>
              ) : null}
            </button>
          );
        })}
      </nav>

      <div className={`flex shrink-0 justify-end border-t ${gmailDivider} px-3 py-2.5`}>
        <button
          type="button"
          data-testid="gmail-hub-refresh-labels"
          onClick={onRefreshLabels}
          className={gmailGhostBtn}
          aria-label={String(t("gmail.hub.refresh"))}
        >
          <RefreshCw className="h-4 w-4" strokeWidth={1.5} />
        </button>
      </div>
    </div>
  );
}
