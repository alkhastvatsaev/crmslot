"use client";

import { ClipboardList } from "lucide-react";
import { AnimatePresence } from "framer-motion";
import { GLASS_PANEL_BODY_SCROLL_COMPACT } from "@/core/ui/glassPanelChrome";
import { cn } from "@/lib/utils";
import IncomingClientRequestDetail from "@/features/backoffice/components/IncomingClientRequestDetail";
import IncomingClientRequestsList from "@/features/backoffice/components/IncomingClientRequestsList";
import { useIncomingClientRequestsController } from "@/features/backoffice/hooks/useIncomingClientRequestsController";

export default function IncomingClientRequestsPanel() {
  const view = useIncomingClientRequestsController();

  if (!view.hasWorkspace) {
    return (
      <div
        data-testid="incoming-requests-gate"
        className="relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-[inherit] px-4 py-6"
      >
        <div className="mx-auto flex w-full max-w-md flex-col items-center justify-center gap-2 rounded-[16px] border border-amber-200/50 bg-amber-50/80 px-4 py-5 text-[13px] shadow-[0_14px_36px_-18px_rgba(15,23,42,0.12)]">
          <p className="font-medium text-amber-800">
            {String(view.t("backoffice.incoming_requests.company_required"))}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      data-testid="incoming-requests-panel"
      className="relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-[inherit]"
    >
      <div className={cn(GLASS_PANEL_BODY_SCROLL_COMPACT, "flex min-h-0 flex-1 flex-col gap-5")}>
        {view.loading ? (
          <div className="space-y-2 py-2">
            {[0, 1].map((i) => (
              <div key={i} className="h-16 animate-pulse rounded-[16px] bg-slate-200/55" />
            ))}
          </div>
        ) : null}

        {!view.loading && view.pendingRequests.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center rounded-[22px] border border-dashed border-black/[0.08] bg-white/60 px-5 py-8 text-center">
            <ClipboardList className="mb-2 h-10 w-10 text-slate-300" />
            <p className="text-sm font-medium text-slate-500">
              {String(view.t("backoffice.incoming_requests.no_new_request"))}
            </p>
          </div>
        ) : null}

        {!view.loading && view.pendingRequests.length > 0 ? (
          <IncomingClientRequestsList view={view} />
        ) : null}
      </div>

      <AnimatePresence>
        {view.selectedRequest ? <IncomingClientRequestDetail view={view} /> : null}
      </AnimatePresence>
    </div>
  );
}
