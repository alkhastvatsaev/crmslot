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
  /** Dossier lié — messages tagués pour la timeline du dossier. */
  chatInterventionId?: string | null;
  onRemoteClientMessage?: () => void;
};

export default function CompanyChatPanel({
  className,
  publishAsPortal = false,
  acceptPortalMessages = false,
  chatCompanyId = null,
  chatInterventionId = null,
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
  } = useCompanyChatPanel({
    publishAsPortal,
    acceptPortalMessages,
    chatCompanyId,
    chatInterventionId,
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
