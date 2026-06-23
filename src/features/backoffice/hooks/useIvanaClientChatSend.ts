"use client";

import { useCallback, type Dispatch, type MutableRefObject, type SetStateAction } from "react";
import { toast } from "sonner";
import type { Auth, User } from "firebase/auth";
import type { Firestore } from "firebase/firestore";
import { isConfigured, storage } from "@/core/config/firebase";
import { logger } from "@/core/logger";
import { publishClientPortalMessage } from "@/features/backoffice/ivanaChatPortalBridge";
import { sendIvanaPortalMessage } from "@/features/backoffice/ivanaChatFirestore";
import { ensureIvanaChatPortalProfile } from "@/features/backoffice/ensureIvanaChatPortalProfile";
import { uploadIvanaChatImagesFromDataUrls } from "@/features/backoffice/ivanaChatStorage";
import { readIvanaChatImageDataUrls } from "@/features/backoffice/ivanaChatImageFiles";
import { requestStaffPortalChatNotification } from "@/features/backoffice/requestStaffPortalChatNotification";
import { requestClientPortalChatNotification } from "@/features/backoffice/requestClientPortalChatNotification";
import { resolveIvanaChatSenderName } from "@/features/backoffice/resolveIvanaChatSenderName";
import { pickIvanaReply, type IvanaChatMessage } from "@/features/backoffice/ivanaChatTypes";
import type { useCrmStaffAccountPanel } from "@/features/auth";
import type { useRequesterHub } from "@/features/interventions/context/RequesterHubContext";

type StaffFields = ReturnType<typeof useCrmStaffAccountPanel>["fields"];
type RequesterProfile = ReturnType<typeof useRequesterHub>["profile"];
type ClientAccountFields = ReturnType<typeof useRequesterHub>["clientAccountFields"];

export function useIvanaClientChatSend({
  draft,
  setDraft,
  pendingImages,
  setPendingImages,
  ivanaTyping,
  setIvanaTyping,
  setMessages,
  fileInputRef,
  pendingDocIdRef,
  publishAsPortal,
  portalAuthReady,
  companyIdTrimmed,
  chatDb,
  chatAuth,
  chatInterventionId,
  staffFields,
  clientAccountFields,
  requesterProfile,
  t,
}: {
  draft: string;
  setDraft: (v: string) => void;
  pendingImages: string[];
  setPendingImages: Dispatch<SetStateAction<string[]>>;
  ivanaTyping: boolean;
  setIvanaTyping: (v: boolean) => void;
  setMessages: Dispatch<SetStateAction<IvanaChatMessage[]>>;
  fileInputRef: MutableRefObject<HTMLInputElement | null>;
  pendingDocIdRef: MutableRefObject<Map<string, string>>;
  publishAsPortal: boolean;
  portalAuthReady: boolean;
  companyIdTrimmed: string;
  chatDb: Firestore | null;
  chatAuth: Auth | null;
  chatInterventionId: string | null;
  staffFields: StaffFields;
  clientAccountFields: ClientAccountFields;
  requesterProfile: RequesterProfile;
  t: (key: string) => string;
}) {
  const handlePickImages = useCallback(
    async (files: FileList | null) => {
      const newUrls = await readIvanaChatImageDataUrls(files, pendingImages.length);
      if (newUrls.length > 0) setPendingImages((prev) => [...prev, ...newUrls]);
      if (fileInputRef.current) fileInputRef.current.value = "";
    },
    [pendingImages.length, setPendingImages, fileInputRef]
  );

  const send = useCallback(async () => {
    const text = draft.trim();
    if ((!text && pendingImages.length === 0) || ivanaTyping) return;

    const wantsFirestore = Boolean(companyIdTrimmed && isConfigured && chatDb);

    if (wantsFirestore) {
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

      if (pendingImages.length > 0 && !storage) {
        toast.error("Chat", {
          description: t("chat.toast_storage_unavailable"),
        });
        return;
      }

      const role = publishAsPortal ? "client" : "staff";
      const currentUser = chatAuth.currentUser as User;
      const senderName = resolveIvanaChatSenderName({
        publishAsPortal,
        user: currentUser,
        staffFields,
        clientAccountFields,
        requesterProfile,
        t,
      });
      const tempId = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
      const optimisticImages = pendingImages.length > 0 ? [...pendingImages] : undefined;
      const optimisticMsg: IvanaChatMessage = {
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
        if (publishAsPortal) {
          await ensureIvanaChatPortalProfile(chatDb, currentUser, companyIdTrimmed);
        }
        let imageUrls: string[] | undefined;
        if (optimisticImages && optimisticImages.length > 0 && storage) {
          imageUrls = await uploadIvanaChatImagesFromDataUrls(storage, {
            companyId: companyIdTrimmed,
            uid: currentUser.uid,
            dataUrls: optimisticImages,
          });
        }
        const docId = await sendIvanaPortalMessage(chatDb, {
          companyId: companyIdTrimmed,
          body: text,
          role,
          senderUid: currentUser.uid,
          senderName,
          interventionId: chatInterventionId,
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
            interventionId: chatInterventionId,
            preview,
            clientLabel: senderName,
          });
        } else {
          void requestClientPortalChatNotification({
            companyId: companyIdTrimmed,
            interventionId: chatInterventionId,
            preview,
            staffLabel: senderName,
          });
        }
      } catch (e) {
        logger.error("IvanaClientChatPanel send", {
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

    const userMsg: IvanaChatMessage = {
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
    setIvanaTyping(true);

    const delay = 700 + Math.floor(Math.random() * 600);
    window.setTimeout(() => {
      const reply: IvanaChatMessage = {
        id: `i-${Date.now()}`,
        role: "ivana",
        text: pickIvanaReply(text, t),
        createdAt: Date.now(),
      };
      setMessages((prev) => [...prev, reply]);
      setIvanaTyping(false);
    }, delay);
  }, [
    draft,
    ivanaTyping,
    pendingImages,
    publishAsPortal,
    companyIdTrimmed,
    chatDb,
    chatAuth,
    chatInterventionId,
    t,
    staffFields,
    clientAccountFields,
    requesterProfile,
    portalAuthReady,
    setDraft,
    setPendingImages,
    setMessages,
    setIvanaTyping,
    pendingDocIdRef,
  ]);

  return { handlePickImages, send };
}
