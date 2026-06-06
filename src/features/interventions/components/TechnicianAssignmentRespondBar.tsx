"use client";

import { useState } from "react";
import { logger } from "@/core/logger";
import { toast } from "sonner";
import type { Intervention } from "@/features/interventions/types";
import {
  acceptTechnicianAssignment,
  declineTechnicianAssignment,
} from "@/features/interventions/respondToTechnicianAssignment";
import { useTranslation } from "@/core/i18n/I18nContext";
import { BidirectionalSlideAction } from "@/components/ui/slide-action";

type Props = {
  iv: Intervention;
  technicianUid: string;
};

/** Accepter / refuser — slider bidirectionnel en bas du panneau central. */
export default function TechnicianAssignmentRespondBar({ iv, technicianUid }: Props) {
  const { t } = useTranslation();
  const [isUpdating, setIsUpdating] = useState(false);

  const handleAccept = async () => {
    if (isUpdating) return;
    setIsUpdating(true);
    try {
      await acceptTechnicianAssignment(iv);
      toast.success(String(t("technician_hub.dashboard.detail.assignment_accepted")));
    } catch (err) {
      logger.error("acceptTechnicianAssignment", {
        error: err instanceof Error ? err.message : String(err),
      });
      const message = err instanceof Error ? err.message : "";
      toast.error(String(t("technician_hub.dashboard.detail.assignment_action_failed")), {
        description: message || undefined,
      });
      throw err;
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDecline = async () => {
    if (isUpdating) return;
    setIsUpdating(true);
    try {
      await declineTechnicianAssignment(iv, technicianUid);
      toast.success(String(t("technician_hub.dashboard.detail.assignment_declined")));
    } catch (err) {
      logger.error("declineTechnicianAssignment", {
        error: err instanceof Error ? err.message : String(err),
      });
      const message = err instanceof Error ? err.message : "";
      toast.error(String(t("technician_hub.dashboard.detail.assignment_action_failed")), {
        description: message || undefined,
      });
      throw err;
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div
      data-testid="technician-assignment-respond-bar"
      className="shrink-0 border-t border-slate-200/50 bg-white px-3 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
    >
      <BidirectionalSlideAction
        testId="technician-assignment-slide"
        disabled={isUpdating}
        acceptLabel={String(t("technician_hub.dashboard.detail.accept_assignment"))}
        declineLabel={String(t("technician_hub.dashboard.detail.decline_assignment"))}
        onAccept={handleAccept}
        onDecline={handleDecline}
      />
      <button
        type="button"
        className="sr-only"
        data-testid="technician-assignment-accept"
        disabled={isUpdating}
        onClick={() => void handleAccept()}
      >
        {t("technician_hub.dashboard.detail.accept_assignment")}
      </button>
      <button
        type="button"
        className="sr-only"
        data-testid="technician-assignment-decline"
        disabled={isUpdating}
        onClick={() => void handleDecline()}
      >
        {t("technician_hub.dashboard.detail.decline_assignment")}
      </button>
    </div>
  );
}
