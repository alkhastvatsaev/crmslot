"use client";

import type { ReactNode } from "react";
import { Loader2 } from "lucide-react";
import GmailHubComposePane, {
  type GmailHubComposeState,
} from "@/features/gmail/components/GmailHubComposePane";
import GmailHubMessageDetailPane from "@/features/gmail/components/GmailHubMessageDetailPane";
import GmailHubPdfPreviewPane from "@/features/gmail/components/GmailHubPdfPreviewPane";
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
  composing: boolean;
  compose: GmailHubComposeState;
  onComposeChange: (patch: Partial<GmailHubComposeState>) => void;
  onCloseCompose: () => void;
  onSend: () => void;
  sending: boolean;
  message: GmailHubMessageDetail | null;
  threadMessages: GmailHubMessageDetail[];
  onFocusThreadMessage: (messageId: string) => void;
  userLabels: GmailHubLabel[];
  loadingDetail: boolean;
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
  pdfPreviewUrl: string | null;
  pdfPreviewError: string | null;
  pdfPreviewAttachmentId: string | null;
  pdfPreviewLoadingId: string | null;
  loadAttachment?: GmailLoadAttachmentFn;
  onOpenPdf: (att: GmailHubAttachment, preview?: GmailPdfAttachmentPreview | null) => void;
  onClosePdf: () => void;
};

export default function GmailHubReaderPane({
  composing,
  compose,
  onComposeChange,
  onCloseCompose,
  onSend,
  sending,
  message,
  threadMessages,
  onFocusThreadMessage,
  userLabels,
  loadingDetail,
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
  pdfPreviewUrl,
  pdfPreviewError,
  pdfPreviewAttachmentId,
  pdfPreviewLoadingId,
  loadAttachment,
  onOpenPdf,
  onClosePdf,
}: Props) {
  const pdfPanelOpen = Boolean(pdfPreviewUrl || pdfPreviewLoadingId || pdfPreviewError);

  if (composing) {
    return (
      <GmailHubComposePane
        compose={compose}
        onComposeChange={onComposeChange}
        onCloseCompose={onCloseCompose}
        onSend={onSend}
        sending={sending}
      />
    );
  }

  if (!message && !pdfPanelOpen) {
    return (
      <div
        className={gmailShell}
        data-testid="gmail-hub-panel-right"
        style={gmailHubFont}
        aria-hidden
      />
    );
  }

  if (loadingDetail && !pdfPanelOpen) {
    return (
      <div
        className={`${gmailShell} items-center justify-center`}
        data-testid="gmail-hub-panel-right"
        style={gmailHubFont}
      >
        <Loader2 className="h-5 w-5 animate-spin text-slate-400" strokeWidth={1.5} />
      </div>
    );
  }

  if (pdfPanelOpen) {
    return (
      <GmailHubPdfPreviewPane
        pdfPreviewUrl={pdfPreviewUrl}
        pdfPreviewError={pdfPreviewError}
        pdfPreviewLoadingId={pdfPreviewLoadingId}
        messageSubject={message?.subject}
        onClosePdf={onClosePdf}
      />
    );
  }

  if (!message) return null;

  return (
    <GmailHubMessageDetailPane
      message={message}
      threadMessages={threadMessages}
      onFocusThreadMessage={onFocusThreadMessage}
      userLabels={userLabels}
      onReply={onReply}
      linkPanelOpen={linkPanelOpen}
      onToggleLinkPanel={onToggleLinkPanel}
      onCreateIntervention={onCreateIntervention}
      creatingIntervention={creatingIntervention}
      linkPanel={linkPanel}
      onToggleRead={onToggleRead}
      onToggleLabel={onToggleLabel}
      onStar={onStar}
      onArchive={onArchive}
      onTrash={onTrash}
      pdfPreviewAttachmentId={pdfPreviewAttachmentId}
      pdfPreviewLoadingId={pdfPreviewLoadingId}
      loadAttachment={loadAttachment}
      onOpenPdf={onOpenPdf}
    />
  );
}
