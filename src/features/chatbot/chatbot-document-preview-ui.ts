import type { ChatbotDocumentPreviewState } from "@/features/chatbot/hooks/useChatbotDocumentPreview";

export type DocumentPreviewOverlayTarget = "left" | "right";

export function isDocumentPreviewOpen(preview: {
  loading: boolean;
  blobUrl: string | null;
  error: string | null;
}): boolean {
  return preview.loading || Boolean(preview.blobUrl) || Boolean(preview.error);
}

export function isPreviewOverlayForTarget(
  preview: Pick<ChatbotDocumentPreviewState, "loading" | "blobUrl" | "error" | "overlayTarget">,
  target: DocumentPreviewOverlayTarget,
): boolean {
  if (!isDocumentPreviewOpen(preview)) return false;
  return (preview.overlayTarget ?? "right") === target;
}
