"use client";

import { useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { logger } from "@/core/logger";
import { toast } from "sonner";
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
import { useState } from "react";

type Props = {
  iv: Intervention;
  technicianUid: string;
  onAccepted?: (next: Intervention) => void;
  onDeclined?: () => void;
};

/** Accepter / refuser — CTA unique + refus discret (terrain). */
export default function TechnicianMobileRespondBar({
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

  return (
    <div data-testid="technician-assignment-respond-bar" className="tm-cta-dock__inner">
      <button
        type="button"
        data-testid="technician-assignment-decline"
        disabled={isUpdating}
        onClick={() => void handleDecline()}
        className="tm-cta-ghost tm-cta-ghost--danger"
      >
        {t("technician_hub.dashboard.detail.decline_assignment")}
      </button>
      <button
        type="button"
        data-testid="technician-assignment-accept"
        disabled={isUpdating}
        onClick={() => void handleAccept()}
        className="tm-cta-pill tm-cta-pill--primary"
      >
        {isUpdating ? (
          <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
        ) : (
          t("technician_hub.dashboard.detail.accept_assignment")
        )}
      </button>
    </div>
  );
}
