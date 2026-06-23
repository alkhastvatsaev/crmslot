"use client";

import type { ReactNode } from "react";
import { useTranslation } from "@/core/i18n/I18nContext";
import GmailHubMessageToolbar from "@/features/gmail/components/GmailHubMessageToolbar";
import GmailHubThreadMessageList from "@/features/gmail/components/GmailHubThreadMessageList";
import { gmailHubFont, gmailShell } from "@/features/gmail/gmailHubUi";
import type {
  GmailHubAttachment,
  GmailHubLabel,
  GmailHubMessageDetail,
} from "@/features/gmail/gmailHubTypes";
import type {
  GmailLoadAttachmentFn,
  GmailPdfAttachmentPreview,
} from "@/features/gmail/useGmailPdfAttachmentPreviews";

type Props = {
  message: GmailHubMessageDetail;
  threadMessages: GmailHubMessageDetail[];
  onFocusThreadMessage: (messageId: string) => void;
  userLabels: GmailHubLabel[];
  onReply: () => void;
  linkPanelOpen: boolean;
  onToggleLinkPanel: () => void;
  onCreateIntervention?: () => void;
  creatingIntervention?: boolean;
  linkPanel: ReactNode;
  onToggleRead: () => void;
  onToggleLabel: (labelId: string) => void;
  onStar: () => void;
  onArchive: () => void;
  onTrash: () => void;
  pdfPreviewAttachmentId: string | null;
  pdfPreviewLoadingId: string | null;
  loadAttachment?: GmailLoadAttachmentFn;
  onOpenPdf: (att: GmailHubAttachment, preview?: GmailPdfAttachmentPreview | null) => void;
};

export default function GmailHubMessageDetailPane({
  message,
  threadMessages,
  onFocusThreadMessage,
  userLabels,
  onReply,
  linkPanelOpen,
  onToggleLinkPanel,
  onCreateIntervention,
  creatingIntervention = false,
  linkPanel,
  onToggleRead,
  onToggleLabel,
  onStar,
  onArchive,
  onTrash,
  pdfPreviewAttachmentId,
  pdfPreviewLoadingId,
  loadAttachment,
  onOpenPdf,
}: Props) {
  const { t } = useTranslation();

  return (
    <div className={gmailShell} data-testid="gmail-hub-detail" style={gmailHubFont}>
      <GmailHubMessageToolbar
        message={message}
        userLabels={userLabels}
        linkPanelOpen={linkPanelOpen}
        onReply={onReply}
        onCreateIntervention={onCreateIntervention}
        creatingIntervention={creatingIntervention}
        onToggleLinkPanel={onToggleLinkPanel}
        onToggleRead={onToggleRead}
        onToggleLabel={onToggleLabel}
        onStar={onStar}
        onArchive={onArchive}
        onTrash={onTrash}
      />

      {linkPanelOpen ? linkPanel : null}

      {threadMessages.length > 1 ? (
        <p
          className="shrink-0 border-b border-black/[0.05] px-4 py-2 text-[11px] text-slate-500"
          data-testid="gmail-hub-thread-count"
        >
          {`${threadMessages.length} ${t("gmail.hub.thread_messages_suffix")}`}
        </p>
      ) : null}

      <GmailHubThreadMessageList
        focusedMessage={message}
        threadMessages={threadMessages}
        onFocusThreadMessage={onFocusThreadMessage}
        pdfPreviewAttachmentId={pdfPreviewAttachmentId}
        pdfPreviewLoadingId={pdfPreviewLoadingId}
        loadAttachment={loadAttachment}
        onOpenPdf={onOpenPdf}
      />
    </div>
  );
}
