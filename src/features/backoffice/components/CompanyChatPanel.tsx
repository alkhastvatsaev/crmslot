"use client";

import { cn } from "@/lib/utils";
import { useCompanyChatPanel } from "@/features/backoffice/hooks/useCompanyChatPanel";
import CompanyChatMessageList from "@/features/backoffice/components/CompanyChatMessageList";
import CompanyChatComposer from "@/features/backoffice/components/CompanyChatComposer";
import type { CompanyChatMessage } from "@/features/backoffice/companyChatTypes";

export type { CompanyChatMessage };

type PanelProps = {
  className?: string;
  publishAsPortal?: boolean;
  acceptPortalMessages?: boolean;
  chatCompanyId?: string | null;
  /** Dossier client (portail) — tag Firestore `interventionId`. */
  chatInterventionId?: string | null;
  /** Fil inbox admin (`__sender__:uid`, dossier, `global`) — affichage uniquement. */
  chatThreadId?: string | null;
  onRemoteClientMessage?: () => void;
};

export default function CompanyChatPanel({
  className,
  publishAsPortal = false,
  acceptPortalMessages = false,
  chatCompanyId = null,
  chatInterventionId = null,
  chatThreadId = null,
  onRemoteClientMessage,
}: PanelProps) {
  const {
    messages,
    assistantTyping,
    draft,
    setDraft,
    pendingImages,
    setPendingImages,
    listRef,
    inputRef,
    fileInputRef,
    handlePickImages,
    send,
    attachImagesBlocked,
    companyIdTrimmed,
    portalAuthReady,
    portalProfileErrorKey,
    portalProfileReady,
  } = useCompanyChatPanel({
    publishAsPortal,
    acceptPortalMessages,
    chatCompanyId,
    chatInterventionId,
    chatThreadId,
    onRemoteClientMessage,
  });

  return (
    <div
      data-testid="company-chat-panel"
      className={cn("flex min-h-0 flex-1 flex-col overflow-hidden", className)}
    >
      <CompanyChatMessageList
        messages={messages}
        assistantTyping={assistantTyping}
        listRef={listRef}
        publishAsPortal={publishAsPortal}
        companyIdTrimmed={companyIdTrimmed}
        portalAuthReady={portalAuthReady}
        portalProfileErrorKey={portalProfileErrorKey}
        portalProfileReady={portalProfileReady}
      />
      <CompanyChatComposer
        draft={draft}
        setDraft={setDraft}
        pendingImages={pendingImages}
        setPendingImages={setPendingImages}
        inputRef={inputRef}
        fileInputRef={fileInputRef}
        handlePickImages={handlePickImages}
        send={send}
        attachImagesBlocked={attachImagesBlocked}
        assistantTyping={assistantTyping}
      />
    </div>
  );
}
