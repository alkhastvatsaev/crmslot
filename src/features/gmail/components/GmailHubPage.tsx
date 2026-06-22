"use client";

import "@/features/gmail/gmail-hub.css";
import AdaptiveTriplePanelLayout from "@/features/dashboard/components/AdaptiveTriplePanelLayout";
import { GMAIL_HUB_SLOT_INDEX } from "@/features/gmail/gmailHubConstants";
import { useGmailHubPageController } from "@/features/gmail/hooks/useGmailHubPageController";
import GmailHubSetupPanel from "@/features/gmail/components/GmailHubSetupPanel";
import GmailHubLinkInterventionPanel from "@/features/gmail/components/GmailHubLinkInterventionPanel";
import GmailHubSidebar from "@/features/gmail/components/GmailHubSidebar";
import GmailHubInboxList from "@/features/gmail/components/GmailHubInboxList";
import GmailHubReaderPane from "@/features/gmail/components/GmailHubReaderPane";
import { gmailShell } from "@/features/gmail/gmailHubUi";

type Props = { slotIndex?: number };

/** Page 7 — Gmail : navigation · liste · lecture (minimal). */
export default function GmailHubPage({ slotIndex = GMAIL_HUB_SLOT_INDEX }: Props) {
  const c = useGmailHubPageController(slotIndex);

  return (
    <AdaptiveTriplePanelLayout
      rootTestId={`dashboard-pager-slot-${slotIndex}`}
      leftTestId={`dashboard-pager-slot-${slotIndex}-panel-left`}
      centerTestId={`dashboard-pager-slot-${slotIndex}-panel-center`}
      rightTestId={`dashboard-pager-slot-${slotIndex}-panel-right`}
      leftAriaLabel={`${c.t("gmail.hub.aria.page")} ${c.humanPage} — ${c.t("gmail.hub.aria.left")}`}
      centerAriaLabel={`${c.t("gmail.hub.aria.page")} ${c.humanPage} — ${c.t("gmail.hub.aria.center")}`}
      rightAriaLabel={`${c.t("gmail.hub.aria.page")} ${c.humanPage} — ${c.t("gmail.hub.aria.right")}`}
      mobileLeftLabel={String(c.t("gmail.hub.mobile.rail_left"))}
      mobileCenterLabel={String(c.t("gmail.hub.mobile.rail_center"))}
      mobileRightLabel={String(c.t("gmail.hub.mobile.rail_right"))}
      centerPadding={false}
      rightPadding={false}
      left={
        c.hub.loadingStatus && !c.hub.status ? (
          <div className={`${gmailShell} items-center justify-center p-6`}>
            <p className="text-[13px] text-slate-400">{c.t("common.loading")}</p>
          </div>
        ) : !c.connected ? undefined : (
          <GmailHubSidebar
            email={c.hub.status?.email ?? ""}
            activeLabelId={c.activeLabelId}
            allLabels={c.hub.labels}
            userLabels={c.userLabels}
            onSelectLabel={c.selectLabel}
            onCompose={c.startCompose}
            onRefreshLabels={() => void c.hub.refreshLabels()}
            onDisconnect={c.handleDisconnect}
          />
        )
      }
      center={
        c.hub.loadingStatus && !c.hub.status ? (
          <div className={`${gmailShell} items-center justify-center px-6`}>
            <p className="text-[13px] text-slate-400">{c.t("common.loading")}</p>
          </div>
        ) : !c.connected ? (
          <GmailHubSetupPanel
            unauthorized={c.unauthorized}
            clientReady={c.clientReady}
            expiredToken={c.invalidGrant}
            onConnect={() => void c.handleConnect()}
          />
        ) : (
          <GmailHubInboxList
            activeLabelKey={c.activeLabelTitle}
            searchQuery={c.searchQuery}
            onSearchChange={c.setSearchQuery}
            onSearchSubmit={c.reloadInbox}
            messages={c.hub.messages}
            selectedId={c.selectedId}
            loading={c.hub.loadingList}
            loadingMore={c.hub.loadingMore}
            hasMore={Boolean(c.hub.nextPageToken)}
            onLoadMore={() =>
              void c.hub.loadMoreMessages({ labelId: c.activeLabelId, q: c.searchQuery })
            }
            error={c.hub.error}
            onSelectMessage={c.handleSelectMessage}
            onToggleRead={(msg, markAsUnread) => void c.handleListToggleRead(msg, markAsUnread)}
          />
        )
      }
      right={
        !c.connected ? undefined : (
          <GmailHubReaderPane
            composing={c.composing}
            compose={{ to: c.composeTo, subject: c.composeSubject, body: c.composeBody }}
            onComposeChange={c.handleComposeChange}
            onCloseCompose={() => c.setComposing(false)}
            onSend={() => void c.handleSend()}
            sending={c.sending}
            message={c.hub.selectedMessage}
            threadMessages={c.hub.threadMessages}
            onFocusThreadMessage={c.handleFocusThreadMessage}
            userLabels={c.userLabels}
            loadingDetail={c.hub.loadingDetail}
            onReply={c.handleReply}
            linkPanelOpen={c.linkPanelOpen}
            onToggleLinkPanel={() => c.setLinkPanelOpen((v) => !v)}
            onCreateIntervention={
              c.companyId ? () => void c.handleCreateInterventionFromEmail() : undefined
            }
            creatingIntervention={c.creatingIntervention}
            linkPanel={
              <GmailHubLinkInterventionPanel
                open={c.linkPanelOpen}
                messageId={c.hub.selectedMessage?.id ?? ""}
                companyId={c.companyId}
                candidates={c.linkCandidates}
                loadingSuggestions={c.linkLoadingSuggestions}
                linking={c.linkLinking}
                suggestionsError={c.linkError}
                interventions={c.interventions}
                onLoadSuggestions={(id) => void c.loadLinkSuggestions(id)}
                onLink={(ivId, note) => void c.handleLinkToIntervention(ivId, note)}
              />
            }
            onToggleRead={c.handleReaderToggleRead}
            onToggleLabel={c.handleToggleLabel}
            onStar={() => void c.handleStar()}
            onArchive={() => void c.handleArchive()}
            onTrash={() => void c.handleTrash()}
            pdfPreviewUrl={c.pdfPreviewUrl}
            pdfPreviewError={c.pdfPreviewError}
            pdfPreviewAttachmentId={c.pdfPreviewAttachmentId}
            pdfPreviewLoadingId={c.pdfPreviewLoadingId}
            loadAttachment={c.hub.loadAttachment}
            onOpenPdf={(att, preview) => void c.handleOpenPdf(att, preview)}
            onClosePdf={c.closePdfPreview}
          />
        )
      }
    />
  );
}
