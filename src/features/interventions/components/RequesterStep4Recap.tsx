"use client";

import { Calendar, FileText, MapPin, UserRound } from "lucide-react";
import { useTranslation } from "@/core/i18n/I18nContext";
import {
  RECAP_SQUARE_ICON_CHIP,
  RECAP_SQUARE_TILE_CLASS,
} from "@/features/interventions/smartFormRecapStyles";

type Props = {
  firstName: string;
  lastName: string;
  phone: string;
  problemLabel: string;
  description: string;
  address: string;
  interventionDate?: string;
  interventionTime?: string;
  urgency: boolean;
};

export default function RequesterStep4Recap({
  firstName,
  lastName,
  phone,
  problemLabel,
  description,
  address,
  interventionDate,
  interventionTime,
  urgency,
}: Props) {
  const { t } = useTranslation();
  const contact =
    [firstName, lastName]
      .filter((s) => s.trim())
      .join(" ")
      .trim() || String(t("requester.ux.recap_missing"));
  const problem = (problemLabel.trim() || description.trim()).slice(0, 120);
  const slot =
    interventionDate || interventionTime
      ? [interventionDate, interventionTime].filter(Boolean).join(" · ")
      : String(t("requester.ux.recap_slot_flexible"));

  return (
    <div
      data-testid="requester-step4-recap"
      className="mb-3 grid shrink-0 grid-cols-2 gap-2"
      aria-label={String(t("requester.ux.recap_aria"))}
    >
      <div className={RECAP_SQUARE_TILE_CLASS}>
        <div className="flex items-center gap-2">
          <span className={RECAP_SQUARE_ICON_CHIP} aria-hidden>
            <UserRound className="h-3.5 w-3.5" />
          </span>
          <span className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
            {String(t("requester.ux.recap_contact"))}
          </span>
        </div>
        <p className="truncate text-[12px] font-semibold text-slate-800">{contact}</p>
        {phone.trim() ? (
          <p className="truncate text-[11px] text-slate-500">{phone.trim()}</p>
        ) : null}
      </div>

      <div className={RECAP_SQUARE_TILE_CLASS}>
        <div className="flex items-center gap-2">
          <span className={RECAP_SQUARE_ICON_CHIP} aria-hidden>
            <FileText className="h-3.5 w-3.5" />
          </span>
          <span className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
            {String(t("requester.ux.recap_problem"))}
          </span>
        </div>
        <p className="line-clamp-2 text-[12px] font-medium text-slate-800">{problem}</p>
        {urgency ? (
          <p className="text-[10px] font-semibold uppercase text-amber-700">
            {String(t("requester.ux.recap_urgent"))}
          </p>
        ) : null}
      </div>

      <div className={RECAP_SQUARE_TILE_CLASS}>
        <div className="flex items-center gap-2">
          <span className={RECAP_SQUARE_ICON_CHIP} aria-hidden>
            <MapPin className="h-3.5 w-3.5" />
          </span>
          <span className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
            {String(t("requester.ux.recap_address"))}
          </span>
        </div>
        <p className="line-clamp-2 text-[12px] text-slate-800">{address.trim() || "—"}</p>
      </div>

      <div className={RECAP_SQUARE_TILE_CLASS}>
        <div className="flex items-center gap-2">
          <span className={RECAP_SQUARE_ICON_CHIP} aria-hidden>
            <Calendar className="h-3.5 w-3.5" />
          </span>
          <span className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
            {String(t("requester.ux.recap_slot"))}
          </span>
        </div>
        <p className="line-clamp-2 text-[12px] text-slate-800">{slot}</p>
      </div>
    </div>
  );
}
