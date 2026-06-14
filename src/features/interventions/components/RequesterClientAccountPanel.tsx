"use client";

import { Loader2, LogOut, Mail, MapPin, Phone, User } from "lucide-react";
import type { AnimationControls } from "framer-motion";
import { motion } from "framer-motion";
import { useTranslation } from "@/core/i18n/I18nContext";
import { HUB_RADIUS, HUB_SURFACE } from "@/core/ui/hub";
import { cn } from "@/lib/utils";
import type { ClientPortalAccountFields } from "@/features/auth/clientPortalAccountProfile";

export type RequesterClientAccountPanelProps = {
  fields: ClientPortalAccountFields;
  updateField: (key: keyof ClientPortalAccountFields, value: string) => void;
  persistAccount: () => Promise<void>;
  handleSignOut: () => Promise<void>;
  saving: boolean;
  validationFailedCount: number;
  shakeControls: AnimationControls;
};

const inputClass = cn(
  "min-w-0 flex-1 border border-black/[0.06] bg-transparent px-3 py-2.5 text-sm font-medium text-slate-900 outline-none placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-slate-900/15",
  HUB_RADIUS.input
);

const iconRail = cn(
  "flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/95 text-slate-500 shadow-[0_4px_14px_-6px_rgba(15,23,42,0.1)]"
);

const glassRow = cn("flex items-center gap-3 transition-colors duration-300", HUB_SURFACE.fieldRow);

export default function RequesterClientAccountPanel({
  fields,
  updateField,
  persistAccount,
  handleSignOut,
  saving,
  validationFailedCount,
  shakeControls,
}: RequesterClientAccountPanelProps) {
  const { t } = useTranslation();
  const isInvalid = (val: string) => validationFailedCount > 0 && !val.trim();

  return (
    <div
      data-testid="requester-client-account-panel"
      className="flex min-h-0 flex-1 flex-col gap-4"
    >
      <p className="text-sm font-bold text-slate-800">{t("requester.account.title")}</p>

      <div className="flex flex-col gap-2.5 rounded-[24px] border border-black/[0.05] bg-white/70 p-3 shadow-[0_18px_44px_-28px_rgba(15,23,42,0.2)]">
        <motion.div
          animate={isInvalid(fields.firstName) ? shakeControls : undefined}
          className={cn(
            glassRow,
            isInvalid(fields.firstName) && "ring-2 ring-red-500 bg-red-50/80"
          )}
        >
          <span className={iconRail}>
            <User
              className={cn(
                "h-5 w-5 opacity-70",
                isInvalid(fields.firstName) && "text-red-500 opacity-100"
              )}
            />
          </span>
          <input
            type="text"
            data-testid="requester-account-first-name"
            placeholder={t("requester.profile.first_name")}
            value={fields.firstName}
            onChange={(e) => updateField("firstName", e.target.value)}
            onBlur={() => void persistAccount()}
            className={cn(inputClass, isInvalid(fields.firstName) && "placeholder:text-red-300")}
          />
        </motion.div>

        <motion.div
          animate={isInvalid(fields.lastName) ? shakeControls : undefined}
          className={cn(glassRow, isInvalid(fields.lastName) && "ring-2 ring-red-500 bg-red-50/80")}
        >
          <span className={iconRail}>
            <User
              className={cn(
                "h-5 w-5 opacity-70",
                isInvalid(fields.lastName) && "text-red-500 opacity-100"
              )}
            />
          </span>
          <input
            type="text"
            data-testid="requester-account-last-name"
            placeholder={t("requester.profile.last_name")}
            value={fields.lastName}
            onChange={(e) => updateField("lastName", e.target.value)}
            onBlur={() => void persistAccount()}
            className={cn(inputClass, isInvalid(fields.lastName) && "placeholder:text-red-300")}
          />
        </motion.div>
      </div>

      <div className="flex flex-col gap-2.5 rounded-[24px] border border-black/[0.05] bg-white/70 p-3 shadow-[0_18px_44px_-28px_rgba(15,23,42,0.2)]">
        <div className={glassRow}>
          <span className={iconRail}>
            <Mail className="h-5 w-5 opacity-70" />
          </span>
          <input
            type="email"
            data-testid="requester-account-email"
            placeholder={t("requester.profile.email_required")}
            value={fields.email}
            readOnly
            autoComplete="off"
            className={cn(inputClass, "text-slate-600")}
          />
        </div>

        <motion.div
          animate={isInvalid(fields.phone) ? shakeControls : undefined}
          className={cn(glassRow, isInvalid(fields.phone) && "ring-2 ring-red-500 bg-red-50/80")}
        >
          <span className={iconRail}>
            <Phone
              className={cn(
                "h-5 w-5 opacity-70",
                isInvalid(fields.phone) && "text-red-500 opacity-100"
              )}
            />
          </span>
          <input
            type="tel"
            data-testid="requester-account-phone"
            placeholder={t("requester.profile.phone")}
            value={fields.phone}
            onChange={(e) => updateField("phone", e.target.value)}
            onBlur={() => void persistAccount()}
            className={cn(inputClass, isInvalid(fields.phone) && "placeholder:text-red-300")}
          />
        </motion.div>

        <div className={cn(glassRow, "items-start")}>
          <span className={iconRail}>
            <MapPin className="h-5 w-5 opacity-70" />
          </span>
          <textarea
            data-testid="requester-account-address"
            placeholder={t("requester.profile.usual_address_optional")}
            value={fields.address}
            rows={2}
            onChange={(e) => updateField("address", e.target.value)}
            onBlur={() => void persistAccount()}
            className={cn(inputClass, "min-h-[4.5rem] resize-none py-2.5")}
          />
        </div>
      </div>

      <button
        type="button"
        data-testid="requester-account-signout"
        disabled={saving}
        onClick={() => void handleSignOut()}
        className="mt-auto flex w-full items-center justify-center gap-2 rounded-[14px] border border-black/[0.08] bg-white px-4 py-3 text-[14px] font-bold text-slate-700 transition-all hover:bg-slate-50 disabled:opacity-50"
      >
        {saving ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
        ) : (
          <LogOut className="h-4 w-4 shrink-0" aria-hidden />
        )}
        {t("auth.signout")}
      </button>
    </div>
  );
}
