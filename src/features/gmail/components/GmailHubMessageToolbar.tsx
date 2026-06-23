"use client";

import {
  Archive,
  FolderPlus,
  Link2,
  Loader2,
  Mail,
  MailOpen,
  Reply,
  Star,
  Tag,
  Trash2,
} from "lucide-react";
import { useTranslation } from "@/core/i18n/I18nContext";
import { cn } from "@/lib/utils";
import { gmailDivider, gmailToolbarBtn } from "@/features/gmail/gmailHubUi";
import type { GmailHubLabel, GmailHubMessageDetail } from "@/features/gmail/gmailHubTypes";

type Props = {
  message: GmailHubMessageDetail;
  userLabels: GmailHubLabel[];
  linkPanelOpen: boolean;
  onReply: () => void;
  onCreateIntervention?: () => void;
  creatingIntervention?: boolean;
  onToggleLinkPanel: () => void;
  onToggleRead: () => void;
  onToggleLabel: (labelId: string) => void;
  onStar: () => void;
  onArchive: () => void;
  onTrash: () => void;
};

export default function GmailHubMessageToolbar({
  message,
  userLabels,
  linkPanelOpen,
  onReply,
  onCreateIntervention,
  creatingIntervention = false,
  onToggleLinkPanel,
  onToggleRead,
  onToggleLabel,
  onStar,
  onArchive,
  onTrash,
}: Props) {
  const { t } = useTranslation();
  const starred = message.labelIds.includes("STARRED");

  return (
    <div
      className={`flex shrink-0 items-center justify-between gap-2 border-b ${gmailDivider} px-3 py-2`}
    >
      <div className="flex min-w-0 flex-1 items-center gap-0.5 rounded-2xl bg-black/[0.03] p-0.5">
        <button
          type="button"
          data-testid="gmail-hub-reply-btn"
          onClick={onReply}
          className={gmailToolbarBtn}
          title={String(t("gmail.hub.reply"))}
        >
          <Reply className="h-4 w-4" strokeWidth={1.5} />
        </button>
        {onCreateIntervention ? (
          <button
            type="button"
            data-testid="gmail-hub-create-intervention-btn"
            disabled={creatingIntervention}
            onClick={onCreateIntervention}
            className={gmailToolbarBtn}
            title={String(t("gmail.hub.create_intervention"))}
          >
            {creatingIntervention ? (
              <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.5} />
            ) : (
              <FolderPlus className="h-4 w-4" strokeWidth={1.5} />
            )}
          </button>
        ) : null}
        <button
          type="button"
          data-testid="gmail-hub-link-toggle-btn"
          onClick={onToggleLinkPanel}
          className={cn(
            gmailToolbarBtn,
            linkPanelOpen && "bg-white/90 text-slate-900 shadow-[0_1px_3px_rgba(15,23,42,0.08)]"
          )}
          title={String(t("gmail.hub.link_to_case"))}
        >
          <Link2 className="h-4 w-4" strokeWidth={1.5} />
        </button>
        <button
          type="button"
          data-testid="gmail-hub-read-toggle-btn"
          onClick={onToggleRead}
          className={gmailToolbarBtn}
          title={
            message.isUnread ? String(t("gmail.hub.mark_read")) : String(t("gmail.hub.mark_unread"))
          }
        >
          {message.isUnread ? (
            <MailOpen className="h-4 w-4" strokeWidth={1.5} />
          ) : (
            <Mail className="h-4 w-4" strokeWidth={1.5} />
          )}
        </button>
        <button
          type="button"
          data-testid="gmail-hub-star-btn"
          onClick={onStar}
          className={gmailToolbarBtn}
          title={String(t("gmail.hub.star"))}
        >
          <Star
            className={starred ? "text-amber-600" : "text-slate-500"}
            strokeWidth={1.5}
            fill={starred ? "currentColor" : "none"}
          />
        </button>
        <button
          type="button"
          data-testid="gmail-hub-archive-btn"
          onClick={onArchive}
          className={gmailToolbarBtn}
          title={String(t("gmail.hub.archive"))}
        >
          <Archive className="h-4 w-4" strokeWidth={1.5} />
        </button>
        <button
          type="button"
          data-testid="gmail-hub-trash-btn"
          onClick={onTrash}
          className={`${gmailToolbarBtn} text-red-600/85 hover:text-red-700`}
          title={String(t("gmail.hub.trash"))}
        >
          <Trash2 className="h-4 w-4" strokeWidth={1.5} />
        </button>
      </div>
      {userLabels.length > 0 ? (
        <label className="relative flex shrink-0 items-center">
          <Tag
            className="pointer-events-none absolute left-2 h-3.5 w-3.5 text-slate-400"
            strokeWidth={1.5}
          />
          <select
            data-testid="gmail-hub-label-select"
            className="h-9 max-w-[140px] appearance-none rounded-xl border-0 bg-white/70 pl-7 pr-2 text-[11px] text-slate-700 shadow-[inset_0_0_0_1px_rgba(15,23,42,0.08)] outline-none"
            defaultValue=""
            onChange={(e) => {
              const id = e.target.value;
              if (id) onToggleLabel(id);
              e.target.value = "";
            }}
            aria-label={String(t("gmail.hub.apply_label"))}
          >
            <option value="">{t("gmail.hub.apply_label")}</option>
            {userLabels.map((l) => (
              <option key={l.id} value={l.id}>
                {message.labelIds.includes(l.id) ? `✓ ${l.name}` : l.name}
              </option>
            ))}
          </select>
        </label>
      ) : null}
    </div>
  );
}
