"use client";

import { cn } from "@/lib/utils";
import { useIvanaClientChatPanel } from "@/features/backoffice/hooks/useIvanaClientChatPanel";
import IvanaChatMessageList from "@/features/backoffice/components/IvanaChatMessageList";
import IvanaChatComposer from "@/features/backoffice/components/IvanaChatComposer";
import type { IvanaChatMessage } from "@/features/backoffice/ivanaChatTypes";

export type { IvanaChatMessage };

type PanelProps = {
  className?: string;
  publishAsPortal?: boolean;
  acceptPortalMessages?: boolean;
  chatCompanyId?: string | null;
  /** Dossier lié — messages tagués pour la timeline du dossier. */
  chatInterventionId?: string | null;
  onRemoteClientMessage?: () => void;
};

export default function IvanaClientChatPanel({
  className,
  publishAsPortal = false,
  acceptPortalMessages = false,
  chatCompanyId = null,
  chatInterventionId = null,
  onRemoteClientMessage,
}: PanelProps) {
  const {
    messages,
    ivanaTyping,
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
  } = useIvanaClientChatPanel({
    publishAsPortal,
    acceptPortalMessages,
    chatCompanyId,
    chatInterventionId,
    onRemoteClientMessage,
  });

  return (
    <div
      data-testid="ivana-client-chat-panel"
      className={cn("flex min-h-0 flex-1 flex-col overflow-hidden", className)}
    >
      <IvanaChatMessageList
        messages={messages}
        ivanaTyping={ivanaTyping}
        listRef={listRef}
        publishAsPortal={publishAsPortal}
        companyIdTrimmed={companyIdTrimmed}
        portalAuthReady={portalAuthReady}
      />
      <IvanaChatComposer
        draft={draft}
        setDraft={setDraft}
        pendingImages={pendingImages}
        setPendingImages={setPendingImages}
        inputRef={inputRef}
        fileInputRef={fileInputRef}
        handlePickImages={handlePickImages}
        send={send}
        attachImagesBlocked={attachImagesBlocked}
        ivanaTyping={ivanaTyping}
      />
    </div>
  );
}
