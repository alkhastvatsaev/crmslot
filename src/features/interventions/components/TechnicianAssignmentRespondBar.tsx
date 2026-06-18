"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { logger } from "@/core/logger";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { Intervention } from "@/features/interventions/types";
import {
  acceptTechnicianAssignment,
  declineTechnicianAssignment,
} from "@/features/interventions/respondToTechnicianAssignment";
import {
  acceptTechnicianAssignmentPatch,
  declineTechnicianAssignmentPatch,
} from "@/features/interventions/technicianAssignmentActions";
import { patchTechnicianAssignmentInCache } from "@/features/interventions/patchTechnicianAssignmentInCache";
import { useTranslation } from "@/core/i18n/I18nContext";

type Props = {
  iv: Intervention;
  technicianUid: string;
  /** Après acceptation réussie — bascule vers la barre d’actions terrain (en_route). */
  onAccepted?: (next: Intervention) => void;
  /** Après refus — mission renvoyée aux admins, vider la sélection. */
  onDeclined?: () => void;
};

/** Accepter / refuser — deux boutons explicites en bas du panneau central. */
export default function TechnicianAssignmentRespondBar({
  iv,
  technicianUid,
  onAccepted,
  onDeclined,
}: Props) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [isUpdating, setIsUpdating] = useState(false);

  const handleAccept = async () => {
    if (isUpdating) return;
    setIsUpdating(true);

    const acceptPatch = acceptTechnicianAssignmentPatch();
    const optimistic: Partial<Intervention> = {
      status: "en_route",
      technicianAcceptedAt: String(acceptPatch.technicianAcceptedAt),
    };
    patchTechnicianAssignmentInCache(queryClient, technicianUid, iv.id, optimistic);

    try {
      await acceptTechnicianAssignment(iv);
      onAccepted?.({ ...iv, ...optimistic } as Intervention);
      toast.success(String(t("technician_hub.dashboard.detail.assignment_accepted")));
    } catch (err) {
      patchTechnicianAssignmentInCache(queryClient, technicianUid, iv.id, {
        status: iv.status,
        technicianAcceptedAt: iv.technicianAcceptedAt,
      });
      logger.error("acceptTechnicianAssignment", {
        error: err instanceof Error ? err.message : String(err),
      });
      const message = err instanceof Error ? err.message : "";
      toast.error(String(t("technician_hub.dashboard.detail.assignment_action_failed")), {
        description: message || undefined,
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDecline = async () => {
    if (isUpdating) return;
    setIsUpdating(true);

    const declinePatch = declineTechnicianAssignmentPatch(technicianUid);
    const optimistic: Partial<Intervention> = {
      status: "pending",
      assignedTechnicianUid: undefined,
      technicianAcceptedAt: undefined,
      technicianDeclinedAt: String(declinePatch.technicianDeclinedAt),
      technicianDeclinedByUid: String(declinePatch.technicianDeclinedByUid),
      returnedToRequestsAt: String(declinePatch.returnedToRequestsAt),
      returnedToRequestsReason: "technician_declined",
    };
    patchTechnicianAssignmentInCache(queryClient, technicianUid, iv.id, optimistic);

    try {
      await declineTechnicianAssignment(iv, technicianUid);
      onDeclined?.();
      toast.success(String(t("technician_hub.dashboard.detail.assignment_declined")));
    } catch (err) {
      patchTechnicianAssignmentInCache(queryClient, technicianUid, iv.id, {
        status: iv.status,
        assignedTechnicianUid: iv.assignedTechnicianUid,
        technicianAcceptedAt: iv.technicianAcceptedAt,
        technicianDeclinedAt: iv.technicianDeclinedAt,
        technicianDeclinedByUid: iv.technicianDeclinedByUid,
        returnedToRequestsAt: iv.returnedToRequestsAt,
        returnedToRequestsReason: iv.returnedToRequestsReason,
      });
      logger.error("declineTechnicianAssignment", {
        error: err instanceof Error ? err.message : String(err),
      });
      const message = err instanceof Error ? err.message : "";
      toast.error(String(t("technician_hub.dashboard.detail.assignment_action_failed")), {
        description: message || undefined,
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const declineLabel = String(t("technician_hub.dashboard.detail.decline_assignment"));
  const acceptLabel = String(t("technician_hub.dashboard.detail.accept_assignment"));

  return (
    <div
      data-testid="technician-assignment-respond-bar"
      className="shrink-0 border-t border-slate-200/50 bg-white px-3 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
    >
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          data-testid="technician-assignment-decline"
          disabled={isUpdating}
          onClick={() => void handleDecline()}
          className={cn(
            "flex min-h-[48px] items-center justify-center rounded-[16px] border border-red-200 bg-red-50 px-3 text-[14px] font-bold text-red-700 shadow-sm transition",
            "hover:bg-red-100 active:scale-[0.99] disabled:opacity-60"
          )}
        >
          {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : declineLabel}
        </button>
        <button
          type="button"
          data-testid="technician-assignment-accept"
          disabled={isUpdating}
          onClick={() => void handleAccept()}
          className={cn(
            "flex min-h-[48px] items-center justify-center rounded-[16px] border border-emerald-200 bg-emerald-600 px-3 text-[14px] font-bold text-white shadow-sm transition",
            "hover:bg-emerald-500 active:scale-[0.99] disabled:opacity-60"
          )}
        >
          {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : acceptLabel}
        </button>
      </div>
    </div>
  );
}
