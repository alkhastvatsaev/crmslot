"use client";

import { X } from "lucide-react";
import { useTranslation } from "@/core/i18n/I18nContext";
import {
  gmailDivider,
  gmailEyebrow,
  gmailFieldClass,
  gmailGhostBtn,
  gmailHubFont,
  gmailPrimaryBtn,
  gmailShell,
} from "@/features/gmail/gmailHubUi";

export type GmailHubComposeState = {
  to: string;
  subject: string;
  body: string;
};

type Props = {
  compose: GmailHubComposeState;
  onComposeChange: (patch: Partial<GmailHubComposeState>) => void;
  onCloseCompose: () => void;
  onSend: () => void;
  sending: boolean;
};

export default function GmailHubComposePane({
  compose,
  onComposeChange,
  onCloseCompose,
  onSend,
  sending,
}: Props) {
  const { t } = useTranslation();

  return (
    <div className={gmailShell} data-testid="gmail-hub-compose" style={gmailHubFont}>
      <div
        className={`flex shrink-0 items-center justify-between border-b ${gmailDivider} px-4 py-3`}
      >
        <p className={gmailEyebrow}>{t("gmail.hub.compose")}</p>
        <button
          type="button"
          onClick={onCloseCompose}
          className={gmailGhostBtn}
          aria-label={String(t("common.cancel"))}
        >
          <X className="h-4 w-4" strokeWidth={1.5} />
        </button>
      </div>
      <div className="flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto px-4 py-4 custom-scrollbar">
        <label className="block">
          <span className={`mb-1 block px-0.5 ${gmailEyebrow}`}>{t("gmail.hub.to")}</span>
          <input
            data-testid="gmail-hub-compose-to"
            value={compose.to}
            onChange={(e) => onComposeChange({ to: e.target.value })}
            className={gmailFieldClass}
          />
        </label>
        <label className="block">
          <span className={`mb-1 block px-0.5 ${gmailEyebrow}`}>{t("gmail.hub.subject")}</span>
          <input
            data-testid="gmail-hub-compose-subject"
            value={compose.subject}
            onChange={(e) => onComposeChange({ subject: e.target.value })}
            className={gmailFieldClass}
          />
        </label>
        <textarea
          data-testid="gmail-hub-compose-body"
          value={compose.body}
          onChange={(e) => onComposeChange({ body: e.target.value })}
          rows={14}
          placeholder={String(t("gmail.hub.body_placeholder"))}
          className={`${gmailFieldClass} min-h-[220px] flex-1 resize-none leading-relaxed`}
        />
      </div>
      <div className={`shrink-0 border-t ${gmailDivider} px-4 py-4`}>
        <button
          type="button"
          data-testid="gmail-hub-send-btn"
          disabled={sending}
          onClick={onSend}
          className={`${gmailPrimaryBtn} w-full`}
        >
          {t("gmail.hub.send")}
        </button>
      </div>
    </div>
  );
}
