"use client";

import "@/features/gmail/gmail-hub.css";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { useDashboardPagerOptional } from "@/features/dashboard/dashboardPagerContext";
import AdaptiveTriplePanelLayout from "@/features/dashboard/components/AdaptiveTriplePanelLayout";
import { GMAIL_HUB_SLOT_INDEX, GMAIL_HUB_SYSTEM_LABELS } from "@/features/gmail/gmailHubConstants";
import { useGmailHub } from "@/features/gmail/useGmailHub";
import { useGmailHubKeyboard } from "@/features/gmail/useGmailHubKeyboard";
import { useGmailHubLinkIntervention } from "@/features/gmail/useGmailHubLinkIntervention";
import { fetchWithAuth } from "@/core/api/fetchWithAuth";
import { DEMO_COMPANY_ID } from "@/core/config/devUiPreview";
import { useTranslation } from "@/core/i18n/I18nContext";
import { useCompanyWorkspaceOptional } from "@/context/CompanyWorkspaceContext";
import { useActivityLog } from "@/features/crmHistory/useActivityLog";
import { useBackOfficeInterventions } from "@/features/backoffice/useBackOfficeInterventions";
import GmailHubSetupPanel from "@/features/gmail/components/GmailHubSetupPanel";
import GmailHubLinkInterventionPanel from "@/features/gmail/components/GmailHubLinkInterventionPanel";
import GmailHubSidebar from "@/features/gmail/components/GmailHubSidebar";
import GmailHubInboxList from "@/features/gmail/components/GmailHubInboxList";
import GmailHubReaderPane from "@/features/gmail/components/GmailHubReaderPane";
import { base64ToBlobUrl, revokeBlobUrl } from "@/features/gmail/gmailHubAttachmentBlob";
import { gmailShell, parseSenderEmail } from "@/features/gmail/gmailHubUi";
import type { GmailHubAttachment, GmailHubMessageSummary } from "@/features/gmail/gmailHubTypes";

type Props = { slotIndex?: number };

/** Page 7 — Gmail : navigation · liste · lecture (minimal). */
export default function GmailHubPage({ slotIndex = GMAIL_HUB_SLOT_INDEX }: Props) {
  const humanPage = slotIndex + 1;
  const { t } = useTranslation();
  const pager = useDashboardPagerOptional();
  const workspace = useCompanyWorkspaceOptional();
  const { logEmail } = useActivityLog();
  const companyId =
    (workspace?.activeCompanyId ?? "").trim() || (workspace?.isTenantUser ? DEMO_COMPANY_ID : null);
  /** Sans pager (tests) : chargement immédiat ; avec pager : uniquement quand la page est visible. */
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
  const oauthReturnHandled = useRef(false);
  const [activeLabelId, setActiveLabelId] = useState("INBOX");
  const [searchQuery, setSearchQuery] = useState("");
  const hub = useGmailHub({ labelId: activeLabelId, enabled: pageActive });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [composing, setComposing] = useState(false);
  const [composeTo, setComposeTo] = useState("");
  const [composeSubject, setComposeSubject] = useState("");
  const [composeBody, setComposeBody] = useState("");
  const [sending, setSending] = useState(false);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);
  const [pdfPreviewAttachmentId, setPdfPreviewAttachmentId] = useState<string | null>(null);
  const [pdfPreviewLoadingId, setPdfPreviewLoadingId] = useState<string | null>(null);
  const [pdfPreviewError, setPdfPreviewError] = useState<string | null>(null);

  const pdfPreviewUrlOwnedRef = useRef(true);

  const closePdfPreview = useCallback(() => {
    setPdfPreviewUrl((prev) => {
      if (pdfPreviewUrlOwnedRef.current) revokeBlobUrl(prev);
      pdfPreviewUrlOwnedRef.current = true;
      return null;
    });
    setPdfPreviewAttachmentId(null);
    setPdfPreviewLoadingId(null);
    setPdfPreviewError(null);
  }, []);

  useEffect(() => {
    closePdfPreview();
  }, [selectedId, closePdfPreview]);

  useEffect(() => {
    setLinkPanelOpen(false);
    resetGmailLink();
  }, [selectedId, resetGmailLink]);

  useEffect(() => {
    if (typeof window === "undefined" || oauthReturnHandled.current) return;
    const params = new URLSearchParams(window.location.search);
    const connected = params.get("gmail_connected");
    const oauthError = params.get("gmail_error");
    if (!connected && !oauthError) return;

    oauthReturnHandled.current = true;
    pager?.setPageIndex(GMAIL_HUB_SLOT_INDEX);

    const cleanOAuthQuery = () => {
      const url = new URL(window.location.href);
      url.searchParams.delete("gmail_connected");
      url.searchParams.delete("gmail_error");
      const next = url.pathname + (url.search || "");
      window.history.replaceState({}, "", next);
    };

    if (connected === "1") {
      void (async () => {
        await hub.refreshStatus({ silent: true });
        await hub.refreshLabels();
        toast.success(String(t("gmail.hub.connected_ok")));
        cleanOAuthQuery();
      })();
      return;
    }

    const errKey =
      oauthError === "access_denied"
        ? "gmail.hub.oauth_denied"
        : oauthError === "no_refresh_token"
          ? "gmail.hub.oauth_no_refresh"
          : "gmail.hub.oauth_failed";
    toast.error(String(t(errKey)));
    cleanOAuthQuery();
  }, [hub, pager, t]);

  const handleOpenPdf = useCallback(
    async (att: GmailHubAttachment, cachedPreview?: { blobUrl: string } | null) => {
      const messageId = hub.selectedMessage?.id;
      if (!messageId) return;
      setPdfPreviewLoadingId(att.attachmentId);
      setPdfPreviewError(null);
      setPdfPreviewUrl((prev) => {
        if (pdfPreviewUrlOwnedRef.current) revokeBlobUrl(prev);
        return null;
      });
      setPdfPreviewAttachmentId(null);
      try {
        if (cachedPreview?.blobUrl) {
          pdfPreviewUrlOwnedRef.current = false;
          setPdfPreviewUrl(cachedPreview.blobUrl);
          setPdfPreviewAttachmentId(att.attachmentId);
          return;
        }
        const data = await hub.loadAttachment(messageId, att);
        const url = base64ToBlobUrl(data.dataBase64, data.mimeType || "application/pdf");
        pdfPreviewUrlOwnedRef.current = true;
        setPdfPreviewUrl(url);
        setPdfPreviewAttachmentId(att.attachmentId);
      } catch (e) {
        setPdfPreviewError(
          e instanceof Error ? e.message : String(t("gmail.hub.attachment_error"))
        );
        setPdfPreviewAttachmentId(att.attachmentId);
      } finally {
        setPdfPreviewLoadingId(null);
      }
    },
    [hub.selectedMessage?.id, hub.loadAttachment, t]
  );

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

  const selectLabel = useCallback(
    (id: string) => {
      setActiveLabelId(id);
      setSelectedId(null);
      setSearchQuery("");
      setComposing(false);
      hub.clearThread();
    },
    [hub]
  );

  const startCompose = useCallback(() => {
    setComposing(true);
    setSelectedId(null);
    hub.setSelectedMessage(null);
    setComposeTo("");
    setComposeSubject("");
    setComposeBody("");
  }, [hub]);

  const handleSelectMessage = useCallback(
    (msg: GmailHubMessageSummary) => {
      setSelectedId(msg.id);
      setComposing(false);
      void hub.loadThread(msg.threadId, msg.id);
      logEmail(msg.subject ?? "(sans objet)");
    },
    [hub.loadThread, logEmail]
  );

  /** Ouvre le mail le plus récent (1er de la liste Gmail) quand rien n'est sélectionné. */
  useEffect(() => {
    if (hub.status?.oauthConfigured !== true || composing || hub.loadingList) return;
    const { messages } = hub;
    if (messages.length === 0) return;
    if (selectedId && messages.some((m) => m.id === selectedId)) return;
    const latest = messages[0];
    setSelectedId(latest.id);
    void hub.loadThread(latest.threadId, latest.id);
  }, [
    hub.status?.oauthConfigured,
    composing,
    hub.loadingList,
    hub.messages,
    selectedId,
    hub.loadThread,
  ]);

  const handleListToggleRead = useCallback(
    async (msg: GmailHubMessageSummary, markAsUnread: boolean) => {
      try {
        await hub.toggleReadState(msg.id, markAsUnread);
        toast.success(
          String(markAsUnread ? t("gmail.hub.marked_unread") : t("gmail.hub.marked_read"))
        );
        logEmail(`${markAsUnread ? "Non-lu" : "Lu"} : ${msg.subject ?? "(sans objet)"}`);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : String(t("common.error")));
      }
    },
    [hub, t, logEmail]
  );

  const handleReaderToggleRead = useCallback(() => {
    const m = hub.selectedMessage;
    if (!m) return;
    void handleListToggleRead(m, !m.isUnread);
  }, [hub.selectedMessage, handleListToggleRead]);

  const handleToggleLabel = useCallback(
    (labelId: string) => {
      const m = hub.selectedMessage;
      if (!m) return;
      void (async () => {
        try {
          await hub.toggleUserLabel(m.id, labelId, m.labelIds.includes(labelId));
          toast.success(String(t("gmail.hub.label_updated")));
        } catch (e) {
          toast.error(e instanceof Error ? e.message : String(t("common.error")));
        }
      })();
    },
    [hub, t]
  );

  const goAdjacentMessage = useCallback(
    (delta: number) => {
      if (!selectedId || hub.messages.length === 0) return;
      const idx = hub.messages.findIndex((m) => m.id === selectedId);
      if (idx < 0) return;
      const next = hub.messages[idx + delta];
      if (next) handleSelectMessage(next);
    },
    [selectedId, hub.messages, handleSelectMessage]
  );

  const handleConnect = async () => {
    try {
      const res = await fetchWithAuth("/api/integrations/gmail/auth-url");
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !data.url) {
        throw new Error(data.error ?? "Impossible de démarrer OAuth Gmail.");
      }
      window.location.href = data.url;
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(t("common.error")));
    }
  };

  const handleDisconnect = () => {
    if (!window.confirm(String(t("gmail.hub.disconnect_confirm")))) return;
    void (async () => {
      try {
        closePdfPreview();
        setSelectedId(null);
        setComposing(false);
        hub.setSelectedMessage(null);
        await hub.disconnectGmail();
        toast.success(String(t("gmail.hub.disconnected_ok")));
      } catch (e) {
        toast.error(e instanceof Error ? e.message : String(t("common.error")));
      }
    })();
  };

  const handleReply = () => {
    const m = hub.selectedMessage;
    if (!m) return;
    setLinkPanelOpen(false);
    setComposeTo(parseSenderEmail(m.from));
    setComposeSubject(m.subject.startsWith("Re:") ? m.subject : `Re: ${m.subject}`);
    setComposeBody(`\n\n—\n${m.bodyText}`);
    setComposing(true);
  };

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

  const handleSend = async () => {
    const m = hub.selectedMessage;
    setSending(true);
    try {
      await hub.sendMessage({
        to: composeTo.trim(),
        subject: composeSubject.trim(),
        bodyText: composeBody.trim(),
        threadId: composing && m ? m.threadId : undefined,
        inReplyTo: composing && m?.messageIdHeader ? m.messageIdHeader : undefined,
        references:
          composing && m
            ? [m.referencesHeader, m.messageIdHeader].filter(Boolean).join(" ").trim() || undefined
            : undefined,
      });
      toast.success(String(t("gmail.hub.sent_ok")));
      setComposing(false);
      setComposeTo("");
      setComposeSubject("");
      setComposeBody("");
      reloadInbox();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(t("common.error")));
    } finally {
      setSending(false);
    }
  };

  const handleStar = async () => {
    const m = hub.selectedMessage;
    if (!m) return;
    const starred = m.labelIds.includes("STARRED");
    // optimistic
    const add = starred ? [] : ["STARRED"];
    const remove = starred ? ["STARRED"] : [];
    hub.setMessages((prev) =>
      prev.map((msg) =>
        msg.id !== m.id
          ? msg
          : {
              ...msg,
              labelIds: [...msg.labelIds.filter((l) => !remove.includes(l)), ...add],
            }
      )
    );
    try {
      await hub.modifyMessage(m.id, add, remove);
      toast.success(String(t("gmail.hub.star_updated")));
      void hub.loadThread(m.threadId, m.id);
    } catch (e) {
      reloadInbox(); // revert
      toast.error(e instanceof Error ? e.message : String(t("common.error")));
    }
  };

  const handleArchive = async () => {
    const m = hub.selectedMessage;
    if (!m) return;
    // optimistic
    hub.setMessages((prev) => prev.filter((msg) => msg.id !== m.id));
    hub.setSelectedMessage(null);
    setSelectedId(null);
    try {
      await hub.modifyMessage(m.id, [], ["INBOX"]);
      toast.success(String(t("gmail.hub.archived")));
    } catch (e) {
      reloadInbox(); // revert
      toast.error(e instanceof Error ? e.message : String(t("common.error")));
    }
  };

  const handleTrash = async () => {
    const m = hub.selectedMessage;
    if (!m) return;
    if (!window.confirm(String(t("gmail.hub.trash_confirm")))) return;
    // optimistic
    hub.setMessages((prev) => prev.filter((msg) => msg.id !== m.id));
    hub.setSelectedMessage(null);
    setSelectedId(null);
    try {
      await hub.trashMessage(m.id);
      toast.success(String(t("gmail.hub.trashed")));
    } catch (e) {
      reloadInbox(); // revert
      toast.error(e instanceof Error ? e.message : String(t("common.error")));
    }
  };

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
    enabled: connected && !composing,
    onReply: handleReply,
    onArchive: () => void handleArchive(),
    onTrash: () => void handleTrash(),
    onNext: () => goAdjacentMessage(1),
    onPrev: () => goAdjacentMessage(-1),
  });

  return (
    <AdaptiveTriplePanelLayout
      rootTestId={`dashboard-pager-slot-${slotIndex}`}
      leftTestId={`dashboard-pager-slot-${slotIndex}-panel-left`}
      centerTestId={`dashboard-pager-slot-${slotIndex}-panel-center`}
      rightTestId={`dashboard-pager-slot-${slotIndex}-panel-right`}
      leftAriaLabel={`${t("gmail.hub.aria.page")} ${humanPage} — ${t("gmail.hub.aria.left")}`}
      centerAriaLabel={`${t("gmail.hub.aria.page")} ${humanPage} — ${t("gmail.hub.aria.center")}`}
      rightAriaLabel={`${t("gmail.hub.aria.page")} ${humanPage} — ${t("gmail.hub.aria.right")}`}
      centerPadding={false}
      rightPadding={false}
      left={
        hub.loadingStatus && !hub.status ? (
          <div className={`${gmailShell} items-center justify-center p-6`}>
            <p className="text-[13px] text-slate-400">{t("common.loading")}</p>
          </div>
        ) : !connected ? undefined : (
          <GmailHubSidebar
            email={hub.status?.email ?? ""}
            activeLabelId={activeLabelId}
            allLabels={hub.labels}
            userLabels={userLabels}
            onSelectLabel={selectLabel}
            onCompose={startCompose}
            onRefreshLabels={() => void hub.refreshLabels()}
            onDisconnect={handleDisconnect}
          />
        )
      }
      center={
        hub.loadingStatus && !hub.status ? (
          <div className={`${gmailShell} items-center justify-center px-6`}>
            <p className="text-[13px] text-slate-400">{t("common.loading")}</p>
          </div>
        ) : !connected ? (
          <GmailHubSetupPanel
            unauthorized={unauthorized}
            clientReady={clientReady}
            expiredToken={invalidGrant}
            onConnect={() => void handleConnect()}
          />
        ) : (
          <GmailHubInboxList
            activeLabelKey={activeLabelTitle}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onSearchSubmit={reloadInbox}
            messages={hub.messages}
            selectedId={selectedId}
            loading={hub.loadingList}
            loadingMore={hub.loadingMore}
            hasMore={Boolean(hub.nextPageToken)}
            onLoadMore={() => void hub.loadMoreMessages({ labelId: activeLabelId, q: searchQuery })}
            error={hub.error}
            onSelectMessage={handleSelectMessage}
            onToggleRead={(msg, markAsUnread) => void handleListToggleRead(msg, markAsUnread)}
          />
        )
      }
      right={
        !connected ? undefined : (
          <GmailHubReaderPane
            composing={composing}
            compose={{ to: composeTo, subject: composeSubject, body: composeBody }}
            onComposeChange={(patch) => {
              if (patch.to !== undefined) setComposeTo(patch.to);
              if (patch.subject !== undefined) setComposeSubject(patch.subject);
              if (patch.body !== undefined) setComposeBody(patch.body);
            }}
            onCloseCompose={() => setComposing(false)}
            onSend={() => void handleSend()}
            sending={sending}
            message={hub.selectedMessage}
            threadMessages={hub.threadMessages}
            onFocusThreadMessage={(id) => {
              setSelectedId(id);
              hub.focusThreadMessage(id);
            }}
            userLabels={userLabels}
            loadingDetail={hub.loadingDetail}
            onReply={handleReply}
            linkPanelOpen={linkPanelOpen}
            onToggleLinkPanel={() => setLinkPanelOpen((v) => !v)}
            linkPanel={
              <GmailHubLinkInterventionPanel
                open={linkPanelOpen}
                messageId={hub.selectedMessage?.id ?? ""}
                companyId={companyId}
                candidates={linkCandidates}
                loadingSuggestions={linkLoadingSuggestions}
                linking={linkLinking}
                suggestionsError={linkError}
                interventions={interventions}
                onLoadSuggestions={(id) => void loadLinkSuggestions(id)}
                onLink={(ivId, note) => void handleLinkToIntervention(ivId, note)}
              />
            }
            onToggleRead={handleReaderToggleRead}
            onToggleLabel={handleToggleLabel}
            onStar={() => void handleStar()}
            onArchive={() => void handleArchive()}
            onTrash={() => void handleTrash()}
            pdfPreviewUrl={pdfPreviewUrl}
            pdfPreviewError={pdfPreviewError}
            pdfPreviewAttachmentId={pdfPreviewAttachmentId}
            pdfPreviewLoadingId={pdfPreviewLoadingId}
            loadAttachment={hub.loadAttachment}
            onOpenPdf={(att, preview) => void handleOpenPdf(att, preview)}
            onClosePdf={closePdfPreview}
          />
        )
      }
    />
  );
}
