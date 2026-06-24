"use client";

import { useCallback, type Dispatch, type MutableRefObject, type SetStateAction } from "react";
import { toast } from "sonner";
import type { Auth, User } from "firebase/auth";
import type { Firestore } from "firebase/firestore";
import type { FirebaseStorage } from "firebase/storage";
import { isConfigured } from "@/core/config/firebase";
import { logger } from "@/core/logger";
import { publishClientPortalMessage } from "@/features/backoffice/portalChatBridge";
import { sendPortalChatMessage } from "@/features/backoffice/portalChatFirestore";
import { requestPortalChatProfileEnsure } from "@/features/backoffice/requestPortalChatProfileEnsure";
import { uploadPortalChatImagesFromDataUrls } from "@/features/backoffice/portalChatStorage";
import { readPortalChatImageDataUrls } from "@/features/backoffice/portalChatImageFiles";
import { requestStaffPortalChatNotification } from "@/features/backoffice/requestStaffPortalChatNotification";
import { requestClientPortalChatNotification } from "@/features/backoffice/requestClientPortalChatNotification";
import { resolvePortalChatSenderName } from "@/features/backoffice/resolvePortalChatSenderName";
import {
  pickLocalChatReply,
  type CompanyChatMessage,
} from "@/features/backoffice/companyChatTypes";
import {
  resolvePortalChatWriteInterventionId,
  portalChatPickerThreadId,
} from "@/features/backoffice/portalChatInboxLogic";
import type { PortalChatDoc } from "@/features/backoffice/portalChatFirestore";
import type { useCrmStaffAccountPanel } from "@/features/auth";
import type { useRequesterHub } from "@/context/RequesterHubContext";

type StaffFields = ReturnType<typeof useCrmStaffAccountPanel>["fields"];
type RequesterProfile = ReturnType<typeof useRequesterHub>["profile"];
type ClientAccountFields = ReturnType<typeof useRequesterHub>["clientAccountFields"];

export function useCompanyChatSend({
  draft,
  setDraft,
  pendingImages,
  setPendingImages,
  assistantTyping,
  setAssistantTyping,
  setMessages,
  fileInputRef,
  pendingDocIdRef,
  publishAsPortal,
  portalAuthReady,
  companyIdTrimmed,
  chatDb,
  chatAuth,
  chatStorage,
  chatInterventionId,
  chatThreadId,
  portalChatRowsRef,
  portalProfileReady,
  staffFields,
  clientAccountFields,
  requesterProfile,
  t,
}: {
  draft: string;
  setDraft: (v: string) => void;
  pendingImages: string[];
  setPendingImages: Dispatch<SetStateAction<string[]>>;
  assistantTyping: boolean;
  setAssistantTyping: (v: boolean) => void;
  setMessages: Dispatch<SetStateAction<CompanyChatMessage[]>>;
  fileInputRef: MutableRefObject<HTMLInputElement | null>;
  pendingDocIdRef: MutableRefObject<Map<string, string>>;
  publishAsPortal: boolean;
  portalAuthReady: boolean;
  companyIdTrimmed: string;
  chatDb: Firestore | null;
  chatAuth: Auth | null;
  chatStorage: FirebaseStorage | null;
  chatInterventionId: string | null;
  chatThreadId: string | null;
  portalChatRowsRef: MutableRefObject<PortalChatDoc[]>;
  portalProfileReady: boolean;
  staffFields: StaffFields;
  clientAccountFields: ClientAccountFields;
  requesterProfile: RequesterProfile;
  t: (key: string) => string;
}) {
  const handlePickImages = useCallback(
    async (files: FileList | null) => {
      const newUrls = await readPortalChatImageDataUrls(files, pendingImages.length);
      if (newUrls.length > 0) setPendingImages((prev) => [...prev, ...newUrls]);
      if (fileInputRef.current) fileInputRef.current.value = "";
    },
    [pendingImages.length, setPendingImages, fileInputRef]
  );

  const send = useCallback(async () => {
    const text = draft.trim();
    if ((!text && pendingImages.length === 0) || assistantTyping) return;

    const wantsFirestore = Boolean(companyIdTrimmed && isConfigured && chatDb);

    if (wantsFirestore) {
      const db = chatDb;
      if (!db) return;

      if (publishAsPortal && !portalAuthReady) {
        toast.error(t("chat.toast_login_required"), {
          description: t("chat.toast_login_description"),
        });
        return;
      }
      if (!chatAuth?.currentUser) {
        toast.error(t("chat.toast_login_required"), {
          description: t("chat.toast_login_description"),
        });
        return;
      }

      if (pendingImages.length > 0 && !chatStorage) {
        toast.error("Chat", {
          description: t("chat.toast_storage_unavailable"),
        });
        return;
      }

      const role = publishAsPortal ? "client" : "staff";
      const currentUser = chatAuth.currentUser as User;
      const senderName = resolvePortalChatSenderName({
        publishAsPortal,
        user: currentUser,
        staffFields,
        clientAccountFields,
        requesterProfile,
        t,
      });
      const tempId = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
      const optimisticImages = pendingImages.length > 0 ? [...pendingImages] : undefined;
      const optimisticMsg: CompanyChatMessage = {
        id: `pending-${tempId}`,
        role,
        text,
        createdAt: Date.now(),
        senderName,
        senderUid: currentUser.uid,
        images: optimisticImages,
        pending: true,
      };

      setMessages((prev) => [...prev, optimisticMsg]);
      setDraft("");
      setPendingImages([]);

      try {
        if (publishAsPortal && !portalProfileReady) {
          await requestPortalChatProfileEnsure(currentUser, companyIdTrimmed);
        }
        const writeIvId = publishAsPortal
          ? chatInterventionId?.trim() || null
          : resolvePortalChatWriteInterventionId(chatThreadId, portalChatRowsRef.current, "staff");
        let imageUrls: string[] | undefined;
        if (optimisticImages && optimisticImages.length > 0 && chatStorage) {
          imageUrls = await uploadPortalChatImagesFromDataUrls(chatStorage, {
            companyId: companyIdTrimmed,
            uid: currentUser.uid,
            dataUrls: optimisticImages,
          });
        }
        const docId = await sendPortalChatMessage(db, {
          companyId: companyIdTrimmed,
          body: text,
          role,
          senderUid: currentUser.uid,
          senderName,
          interventionId: writeIvId,
          ...(imageUrls && imageUrls.length > 0 ? { imageUrls } : {}),
        });
        pendingDocIdRef.current.set(tempId, docId);
        if (imageUrls && imageUrls.length > 0) {
          setMessages((prev) =>
            prev.map((m) => (m.id === optimisticMsg.id ? { ...m, images: imageUrls } : m))
          );
        }
        const preview = text || (imageUrls?.length ? "Photo jointe" : "");
        if (publishAsPortal) {
          void requestStaffPortalChatNotification({
            companyId: companyIdTrimmed,
            interventionId: writeIvId,
            chatThreadId: portalChatPickerThreadId({
              role: "client",
              senderUid: currentUser.uid,
              interventionId: writeIvId,
            }),
            preview,
            clientLabel: senderName,
            user: currentUser,
          });
        } else {
          void requestClientPortalChatNotification({
            companyId: companyIdTrimmed,
            interventionId: writeIvId,
            preview,
            staffLabel: senderName,
          });
        }
      } catch (e) {
        logger.error("CompanyChatPanel send", {
          error: e instanceof Error ? e.message : String(e),
        });
        toast.error("Chat", {
          description: e instanceof Error ? e.message : t("chat.toast_send_failed"),
        });
        setMessages((prev) =>
          prev.map((m) => (m.id === optimisticMsg.id ? { ...m, pending: false, failed: true } : m))
        );
      }
      return;
    }

    const userMsg: CompanyChatMessage = {
      id: `u-${Date.now()}`,
      role: "user",
      text,
      images: pendingImages.length > 0 ? pendingImages : undefined,
      createdAt: Date.now(),
    };
    setDraft("");
    setPendingImages([]);
    setMessages((prev) => [...prev, userMsg]);
    if (publishAsPortal) {
      publishClientPortalMessage({
        id: userMsg.id,
        text: userMsg.text,
        images: userMsg.images,
        createdAt: userMsg.createdAt,
      });
      void requestStaffPortalChatNotification({
        companyId: companyIdTrimmed,
        interventionId: chatInterventionId,
        preview: userMsg.text || (userMsg.images?.length ? "Photo jointe" : ""),
      });
    }
    setAssistantTyping(true);

    const delay = 700 + Math.floor(Math.random() * 600);
    window.setTimeout(() => {
      const reply: CompanyChatMessage = {
        id: `i-${Date.now()}`,
        role: "assistant",
        text: pickLocalChatReply(text, t),
        createdAt: Date.now(),
      };
      setMessages((prev) => [...prev, reply]);
      setAssistantTyping(false);
    }, delay);
  }, [
    draft,
    assistantTyping,
    pendingImages,
    publishAsPortal,
    companyIdTrimmed,
    chatDb,
    chatAuth,
    chatStorage,
    chatInterventionId,
    chatThreadId,
    portalChatRowsRef,
    portalProfileReady,
    t,
    staffFields,
    clientAccountFields,
    requesterProfile,
    portalAuthReady,
    setDraft,
    setPendingImages,
    setMessages,
    setAssistantTyping,
    pendingDocIdRef,
  ]);

  return { handlePickImages, send };
}
