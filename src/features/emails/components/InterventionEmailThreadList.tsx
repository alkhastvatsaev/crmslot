"use client";

import type { RefObject } from "react";
import { useTranslation } from "@/core/i18n/I18nContext";
import InterventionEmailBubble from "@/features/emails/components/InterventionEmailBubble";
import type { InterventionEmailDoc } from "@/features/emails/interventionEmailFirestore";

type Props = {
  listRef: RefObject<HTMLDivElement | null>;
  emails: InterventionEmailDoc[];
  loading: boolean;
  onReply: (email: InterventionEmailDoc) => void;
  onMarkRead: (id: string) => void;
};

export default function InterventionEmailThreadList({
  listRef,
  emails,
  loading,
  onReply,
  onMarkRead,
}: Props) {
  const { t } = useTranslation();

  return (
    <div
      ref={listRef}
      data-testid="email-thread-list"
      className="max-h-64 overflow-y-auto p-4 space-y-4"
    >
      {loading && emails.length === 0 ? (
        <div className="py-4 flex justify-center">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-200 border-t-blue-500" />
        </div>
      ) : (
        emails.map((email) => (
          <InterventionEmailBubble
            key={email.id}
            email={email}
            onReply={onReply}
            onMarkRead={onMarkRead}
            replyLabel={String(t("emails.reply"))}
          />
        ))
      )}
    </div>
  );
}
