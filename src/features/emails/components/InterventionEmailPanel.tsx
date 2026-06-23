"use client";

import { Mail } from "lucide-react";
import { useTranslation } from "@/core/i18n/I18nContext";
import InterventionEmailComposeForm from "@/features/emails/components/InterventionEmailComposeForm";
import InterventionEmailDefaultHeader from "@/features/emails/components/InterventionEmailDefaultHeader";
import InterventionEmailPatronMenu from "@/features/emails/components/InterventionEmailPatronMenu";
import InterventionEmailThreadList from "@/features/emails/components/InterventionEmailThreadList";
import { useInterventionEmailPanelController } from "@/features/emails/hooks/useInterventionEmailPanelController";
import type { InterventionEmailPanelVariant } from "@/features/emails/interventionEmailPanelTypes";

type Props = {
  interventionId: string;
  companyId: string | null;
  variant?: InterventionEmailPanelVariant;
  defaultComposeTo?: string | null;
};

export default function InterventionEmailPanel({
  interventionId,
  companyId,
  variant = "default",
  defaultComposeTo,
}: Props) {
  const { t } = useTranslation();
  const c = useInterventionEmailPanelController({
    interventionId,
    companyId,
    variant,
    defaultComposeTo,
  });

  return (
    <div data-testid="intervention-email-panel" className="space-y-2">
      {c.isPatron ? (
        <InterventionEmailPatronMenu
          unreadCount={c.unreadCount}
          emailCount={c.emails.length}
          patronView={c.patronView}
          composing={c.composing}
          showCompose={c.showCompose}
          lastInbound={c.lastInbound}
          onShowThread={c.showToThread}
          onOpenCompose={c.openNewCompose}
          onReplyToLast={c.openReplyToLast}
        />
      ) : (
        <InterventionEmailDefaultHeader
          expanded={c.panelExpanded}
          unreadCount={c.unreadCount}
          emailCount={c.emails.length}
          onToggle={() => c.setExpanded((v) => !v)}
        />
      )}

      {c.panelExpanded && (
        <div className="rounded-[18px] border border-slate-100 bg-white overflow-hidden">
          {c.showThread && c.emails.length > 0 && (
            <InterventionEmailThreadList
              listRef={c.listRef}
              emails={c.emails}
              loading={c.loading}
              onReply={c.openReply}
              onMarkRead={c.handleMarkRead}
            />
          )}

          {c.showThread && c.emails.length === 0 && !c.loading && !c.showCompose && (
            <div
              data-testid="email-panel-empty"
              className="px-4 py-6 text-center text-[12px] text-slate-400"
            >
              {t("emails.empty")}
            </div>
          )}

          {c.showCompose ? (
            <InterventionEmailComposeForm
              compose={c.compose}
              onComposeChange={c.patchCompose}
              onClose={c.closeCompose}
              onSend={c.handleSend}
              sending={c.sending}
            />
          ) : !c.isPatron ? (
            <div className="border-t border-slate-100 p-3">
              <button
                type="button"
                data-testid="email-compose-open"
                onClick={c.openNewCompose}
                className="flex w-full items-center justify-center gap-2 rounded-[12px] py-2.5 text-[12px] font-bold text-blue-600 hover:bg-blue-50 transition-colors"
              >
                <Mail className="w-4 h-4" />
                {t("emails.write")}
              </button>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
