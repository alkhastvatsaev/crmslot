"use client";

import { ClipboardList } from "lucide-react";
import { motion } from "framer-motion";
import { formatIncomingRequestClientName } from "@/features/backoffice/incomingRequestClientDisplayName";
import type { useIncomingClientRequestsController } from "@/features/backoffice/hooks/useIncomingClientRequestsController";
import SlaStatusBadge from "@/features/sla/components/SlaStatusBadge";
import type { Intervention } from "@/features/interventions/types";

type View = ReturnType<typeof useIncomingClientRequestsController>;

export default function IncomingClientRequestsList({
  view,
}: {
  view: Pick<View, "pendingRequests" | "slaEnabled" | "t" | "setSelectedRequest">;
}) {
  const { pendingRequests, slaEnabled, t, setSelectedRequest } = view;
  const anonymous = String(t("backoffice.inbox.anonymous_client"));

  return (
    <>
      {pendingRequests.map((req: Intervention, index: number) => {
        const clientName = formatIncomingRequestClientName(req, anonymous);
        const cardClass =
          "shadow-[0_8px_24px_-8px_rgba(15,23,42,0.12)] hover:shadow-[0_14px_32px_-10px_rgba(15,23,42,0.18)]";

        return (
          <motion.div
            key={req.id}
            data-testid={`incoming-request-card-${req.id}`}
            onClick={() => setSelectedRequest(req)}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
            className={`group relative grid cursor-pointer grid-cols-1 items-center gap-2 rounded-[16px] bg-white px-4 py-4 transition-all duration-300 hover:bg-white ${cardClass}`}
          >
            <h3 className="truncate text-center text-[14px] font-semibold text-slate-800">
              {clientName}
            </h3>
            {slaEnabled ? (
              <div className="flex justify-center">
                <SlaStatusBadge intervention={req} />
              </div>
            ) : null}
          </motion.div>
        );
      })}
    </>
  );
}
