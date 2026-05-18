"use client";

import { useState } from "react";
import { Check, X } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { firestore } from "@/core/config/firebase";
import { transitionInterventionStatus } from "@/features/interventions/workflow/transitionInterventionStatus";
import { requireAuthTransitionActor } from "@/features/interventions/workflow/workflowActor";
import type { Intervention } from "@/features/interventions/types";
import {
  acceptTechnicianAssignmentPatch,
  declineTechnicianAssignmentPatch,
} from "@/features/interventions/technicianAssignmentActions";
import { formatScheduledTimeOnly } from "@/features/interventions/technicianSchedule";
import { capitalizeName } from "@/utils/stringUtils";
import { guessGenderPrefixFromName } from "@/utils/genderDetection";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/core/i18n/I18nContext";

const outfit = { fontFamily: "'Outfit', sans-serif" } as const;

type Props = {
  iv: Intervention;
  index: number;
  isSelected: boolean;
  technicianUid: string;
  onSelect: () => void;
};

export default function TechnicianAssignmentOfferCard({
  iv,
  index,
  isSelected,
  technicianUid,
  onSelect,
}: Props) {
  const { t } = useTranslation();
  const [isUpdating, setIsUpdating] = useState(false);

  let firstName = iv.clientFirstName;
  let lastName = iv.clientLastName;
  if (!firstName && iv.clientName) {
    const parts = iv.clientName.trim().split(" ");
    firstName = parts[0];
    if (!lastName && parts.length > 1) lastName = parts.slice(1).join(" ");
    else if (!lastName) lastName = parts[0];
  }
  const lastNameSafe = (lastName ?? iv.title ?? t("backoffice.dashboard.client") ?? "").toString();
  const displayLabel = guessGenderPrefixFromName(firstName)
    ? `${guessGenderPrefixFromName(firstName)} ${capitalizeName(lastNameSafe)}`
    : capitalizeName(lastNameSafe);

  const timeLabelRaw = formatScheduledTimeOnly(iv);
  const timeLabel =
    typeof timeLabelRaw === "string" && timeLabelRaw.includes(".")
      ? String(t(timeLabelRaw))
      : timeLabelRaw;

  const handleAccept = async () => {
    if (!firestore || isUpdating) return;
    setIsUpdating(true);
    try {
      await transitionInterventionStatus({
        db: firestore,
        interventionId: iv.id,
        iv,
        toStatus: "en_route",
        actor: requireAuthTransitionActor("technician"),
        extraPatch: acceptTechnicianAssignmentPatch(),
      });
      toast.success(String(t("technician_hub.dashboard.detail.assignment_accepted")));
    } catch (err) {
      console.error(err);
      toast.error(String(t("technician_hub.dashboard.detail.assignment_action_failed")));
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDecline = async () => {
    if (!firestore || isUpdating) return;
    setIsUpdating(true);
    try {
      await transitionInterventionStatus({
        db: firestore,
        interventionId: iv.id,
        iv,
        toStatus: "pending",
        actor: requireAuthTransitionActor("technician"),
        extraPatch: declineTechnicianAssignmentPatch(technicianUid),
      });
      toast.success(String(t("technician_hub.dashboard.detail.assignment_declined")));
    } catch (err) {
      console.error(err);
      toast.error(String(t("technician_hub.dashboard.detail.assignment_action_failed")));
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2, delay: index * 0.03 }}
      style={outfit}
      data-testid={`technician-assignment-offer-${iv.id}`}
      className={cn(
        "w-full rounded-[20px] border px-3 py-3 transition-all",
        isSelected
          ? "border-amber-300 bg-amber-50/95 ring-1 ring-amber-200 shadow-[0_14px_32px_-10px_rgba(245,158,11,0.35)]"
          : "border-amber-200/90 bg-amber-50/80 shadow-[0_8px_24px_-8px_rgba(245,158,11,0.2)]",
      )}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect();
        }
      }}
      role="button"
      tabIndex={0}
    >
      <div className="flex items-center gap-2 mb-2.5">
        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500 animate-pulse" aria-hidden />
        <span className="text-[10px] font-black uppercase tracking-widest text-amber-700">
          {t("technician_hub.dashboard.detail.new_assignment")}
        </span>
        <span className="ml-auto text-[13px] font-bold tabular-nums text-amber-950/70">{timeLabel}</span>
      </div>

      <p className="truncate text-[15px] font-bold text-slate-900 mb-3">{displayLabel}</p>

      <div className="flex justify-center gap-3" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          data-testid="technician-assignment-decline"
          disabled={isUpdating}
          onClick={() => void handleDecline()}
          aria-label={String(t("technician_hub.dashboard.detail.decline_assignment"))}
          className="flex h-14 w-14 items-center justify-center rounded-2xl border border-neutral-200 bg-white text-neutral-700 transition active:scale-95 disabled:opacity-60"
        >
          <X className="h-6 w-6" aria-hidden />
        </button>
        <button
          type="button"
          data-testid="technician-assignment-accept"
          disabled={isUpdating}
          onClick={() => void handleAccept()}
          aria-label={String(t("technician_hub.dashboard.detail.accept_assignment"))}
          className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#0F172A] text-white transition active:scale-95 disabled:opacity-60"
        >
          <Check className="h-6 w-6 shrink-0" aria-hidden />
        </button>
      </div>
    </motion.div>
  );
}
