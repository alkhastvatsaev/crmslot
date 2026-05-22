"use client";

import { motion } from "framer-motion";
import type { Intervention } from "@/features/interventions/types";
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
  onSelect: () => void;
};

/** Entrée liste gauche pour une assignation en attente (actions dans le panneau central). */
export default function TechnicianAssignmentOfferCard({
  iv,
  index,
  isSelected,
  onSelect,
}: Props) {
  const { t } = useTranslation();

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

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2, delay: index * 0.03 }}
      style={outfit}
      data-testid={`technician-assignment-offer-${iv.id}`}
      className={cn(
        "w-full rounded-[20px] border px-3 py-2.5 transition-all",
        isSelected
          ? "border-neutral-900 bg-neutral-50"
          : "border-neutral-200/80 bg-white hover:bg-neutral-50",
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
      <div className="mb-1 flex items-center gap-2">
        <span className="h-1.5 w-1.5 shrink-0 animate-pulse rounded-full bg-blue-500" aria-hidden />
        <span className="text-[10px] font-black uppercase tracking-widest text-neutral-500">
          {t("technician_hub.dashboard.detail.new_assignment")}
        </span>
        <span className="ml-auto text-[13px] font-bold tabular-nums text-neutral-600">{timeLabel}</span>
      </div>
      <p className="truncate text-[15px] font-bold text-slate-900">{displayLabel}</p>
    </motion.div>
  );
}
