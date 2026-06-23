"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useDashboardPagerOptional } from "@/features/dashboard/dashboardPagerContext";
import { GMAIL_HUB_SYSTEM_LABELS } from "@/features/gmail/gmailHubConstants";
import { useGmailHub } from "@/features/gmail/useGmailHub";
import { useGmailHubKeyboard } from "@/features/gmail/useGmailHubKeyboard";
import { useGmailHubLinkIntervention } from "@/features/gmail/useGmailHubLinkIntervention";
import { useGmailCreateIntervention } from "@/features/gmail/hooks/useGmailCreateIntervention";
import { useGmailHubPdfPreview } from "@/features/gmail/hooks/useGmailHubPdfPreview";
import { useGmailHubOAuthReturn } from "@/features/gmail/hooks/useGmailHubOAuthReturn";
import { useGmailHubCompose } from "@/features/gmail/hooks/useGmailHubCompose";
import { useGmailHubReaderActions } from "@/features/gmail/hooks/useGmailHubReaderActions";
import { useGmailHubAccountActions } from "@/features/gmail/hooks/useGmailHubAccountActions";
import { useTranslation } from "@/core/i18n/I18nContext";
import { useCompanyWorkspaceOptional } from "@/context/CompanyWorkspaceContext";
import { useActivityLog } from "@/features/crmHistory/useActivityLog";
import { useBackOfficeInterventions } from "@/features/backoffice/useBackOfficeInterventions";
import type { GmailHubMessageSummary } from "@/features/gmail/gmailHubTypes";

export function useGmailHubPageController(slotIndex: number) {
  const humanPage = slotIndex + 1;
  const { t } = useTranslation();
  const pager = useDashboardPagerOptional();
  const workspace = useCompanyWorkspaceOptional();
  const { logEmail } = useActivityLog();
  const companyId = (workspace?.activeCompanyId ?? "").trim() || null;
  const pageActive = pager == null || pager.pageIndex === slotIndex;
  const [linkPanelOpen, setLinkPanelOpen] = useState(false);
  const { interventions } = useBackOfficeInterventions(linkPanelOpen ? companyId : null);
  const {
    candidates: linkCandidates,
    loadingSuggestions: linkLoadingSuggestions,
    linking: linkLinking,
    error: linkError,
    loadSuggestions: loadLinkSuggestions,
    linkToIntervention,
    reset: resetGmailLink,
  } = useGmailHubLinkIntervention(companyId);
  const { creating: creatingIntervention, createFromMessage } =
    useGmailCreateIntervention(companyId);

  const [activeLabelId, setActiveLabelId] = useState("INBOX");
  const [searchQuery, setSearchQuery] = useState("");
  const hub = useGmailHub({ labelId: activeLabelId, enabled: pageActive });
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const {
    pdfPreviewUrl,
    pdfPreviewAttachmentId,
    pdfPreviewLoadingId,
    pdfPreviewError,
    closePdfPreview,
    handleOpenPdf,
  } = useGmailHubPdfPreview({
    selectedId,
    selectedMessageId: hub.selectedMessage?.id,
    loadAttachment: hub.loadAttachment,
    attachmentErrorLabel: String(t("gmail.hub.attachment_error")),
  });

  useGmailHubOAuthReturn(hub);

  useEffect(() => {
    setLinkPanelOpen(false);
    resetGmailLink();
  }, [selectedId, resetGmailLink]);

  const userLabels = useMemo(
    () => hub.labels.filter((l) => l.type === "user").slice(0, 12),
    [hub.labels]
  );

  const activeLabelTitle = useMemo(() => {
    const system = GMAIL_HUB_SYSTEM_LABELS.find((l) => l.id === activeLabelId);
    if (system) return t(system.labelKey);
    return userLabels.find((l) => l.id === activeLabelId)?.name ?? activeLabelId;
  }, [activeLabelId, userLabels, t]);

  const reloadInbox = useCallback(() => {
    hub.clearThread();
    setSelectedId(null);
    void hub.loadMessages({ labelId: activeLabelId, q: searchQuery });
  }, [hub, activeLabelId, searchQuery]);

  const compose = useGmailHubCompose({
    hub,
    reloadInbox,
    t,
    setLinkPanelOpen,
    setSelectedId,
  });

  const selectLabel = useCallback(
    (id: string) => {
      setActiveLabelId(id);
      setSelectedId(null);
      setSearchQuery("");
      compose.setComposing(false);
      hub.clearThread();
    },
    [hub, compose]
  );

  const handleSelectMessage = useCallback(
    (msg: GmailHubMessageSummary) => {
      setSelectedId(msg.id);
      compose.setComposing(false);
      void hub.loadThread(msg.threadId, msg.id);
      logEmail(msg.subject ?? "(sans objet)");
    },
    [hub.loadThread, logEmail, compose]
  );

  const reader = useGmailHubReaderActions({
    hub,
    selectedId,
    setSelectedId,
    reloadInbox,
    t,
    logEmail,
    handleSelectMessage,
  });

  const account = useGmailHubAccountActions({
    hub,
    t,
    closePdfPreview,
    setSelectedId,
    setComposing: compose.setComposing,
  });

  useEffect(() => {
    if (hub.status?.oauthConfigured !== true || compose.composing || hub.loadingList) return;
    const { messages } = hub;
    if (messages.length === 0) return;
    if (selectedId && messages.some((m) => m.id === selectedId)) return;
    const latest = messages[0];
    setSelectedId(latest.id);
    void hub.loadThread(latest.threadId, latest.id);
  }, [
    hub.status?.oauthConfigured,
    compose.composing,
    hub.loadingList,
    hub.messages,
    selectedId,
    hub.loadThread,
  ]);

  const handleCreateInterventionFromEmail = useCallback(async () => {
    const m = hub.selectedMessage;
    if (!m || !companyId) return;
    try {
      const result = await createFromMessage(m.id);
      toast.success(String(t("gmail.hub.create_intervention_ok")), {
        description: result.autoAssigned
          ? String(t("gmail.hub.create_intervention_assigned")).replace(
              "{{name}}",
              result.technicianName ?? "—"
            )
          : String(t("gmail.hub.create_intervention_pending_assign")),
      });
      setLinkPanelOpen(false);
      resetGmailLink();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(t("common.error")));
    }
  }, [hub.selectedMessage, companyId, createFromMessage, resetGmailLink, t]);

  const handleLinkToIntervention = useCallback(
    async (interventionId: string, note?: string) => {
      const m = hub.selectedMessage;
      if (!m) return;
      try {
        await linkToIntervention(m.id, interventionId, note);
        toast.success(String(t("gmail.hub.link_ok")));
        setLinkPanelOpen(false);
        resetGmailLink();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : String(t("common.error")));
      }
    },
    [hub.selectedMessage, linkToIntervention, resetGmailLink, t]
  );

  const handleFocusThreadMessage = useCallback(
    (id: string) => {
      setSelectedId(id);
      hub.focusThreadMessage(id);
    },
    [hub]
  );

  const devLocal = hub.status?.devLocalMode === true;
  const unauthorized =
    !devLocal &&
    !!(
      hub.error?.toLowerCase().includes("non autoris") ||
      hub.error?.toLowerCase().includes("unauthorized")
    );
  const invalidGrant = hub.error?.toLowerCase().includes("invalid_grant") === true;
  const clientReady = hub.status?.oauthClientConfigured === true;
  const connected = !invalidGrant && hub.status?.oauthConfigured === true;

  useGmailHubKeyboard({
    enabled: connected && !compose.composing,
    onReply: compose.handleReply,
    onArchive: () => void reader.handleArchive(),
    onTrash: () => void reader.handleTrash(),
    onNext: () => reader.goAdjacentMessage(1),
    onPrev: () => reader.goAdjacentMessage(-1),
  });

  return {
    t,
    humanPage,
    hub,
    activeLabelId,
    searchQuery,
    setSearchQuery,
    selectedId,
    composing: compose.composing,
    setComposing: compose.setComposing,
    composeTo: compose.composeTo,
    composeSubject: compose.composeSubject,
    composeBody: compose.composeBody,
    handleComposeChange: compose.handleComposeChange,
    sending: compose.sending,
    userLabels,
    activeLabelTitle,
    devLocal,
    unauthorized,
    invalidGrant,
    clientReady,
    connected,
    linkPanelOpen,
    setLinkPanelOpen,
    linkCandidates,
    linkLoadingSuggestions,
    linkLinking,
    linkError,
    loadLinkSuggestions,
    interventions,
    companyId,
    creatingIntervention,
    pdfPreviewUrl,
    pdfPreviewError,
    pdfPreviewAttachmentId,
    pdfPreviewLoadingId,
    closePdfPreview,
    handleOpenPdf,
    reloadInbox,
    selectLabel,
    startCompose: compose.startCompose,
    handleSelectMessage,
    handleListToggleRead: reader.handleListToggleRead,
    handleReaderToggleRead: reader.handleReaderToggleRead,
    handleToggleLabel: reader.handleToggleLabel,
    handleConnect: account.handleConnect,
    handleDisconnect: account.handleDisconnect,
    handleReply: compose.handleReply,
    handleCreateInterventionFromEmail,
    handleLinkToIntervention,
    handleSend: compose.handleSend,
    handleStar: reader.handleStar,
    handleArchive: reader.handleArchive,
    handleTrash: reader.handleTrash,
    handleFocusThreadMessage,
  };
}
