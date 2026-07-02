"use client";

import { useEffect, type KeyboardEvent } from "react";
import { Loader2, Mail, Phone, SendHorizontal, User } from "lucide-react";
import ClientPortalAuthPanel from "@/features/auth/components/ClientPortalAuthPanel";
import { useClientPortalAccount } from "@/features/auth/hooks/useClientPortalAccount";
import { dispatchRequesterInterventionEnterSubmit } from "@/features/interventions/smartInterventionConstants";
import RequesterClientAccountPanel from "@/features/interventions/components/RequesterClientAccountPanel";
import { useRequesterInterventionForm } from "@/features/interventions/hooks/useRequesterInterventionForm";
import { useRequesterHub, RequesterType } from "@/context/RequesterHubContext";
import { HUB_RADIUS, HUB_SURFACE, HubSegmentedControl } from "@/core/ui/hub";
import { cn } from "@/lib/utils";
import { motion, useAnimation } from "framer-motion";
import { useTranslation } from "@/core/i18n/I18nContext";

const inputClass = cn(
  "min-w-0 flex-1 border border-black/[0.06] bg-transparent px-3 py-2.5 text-sm font-medium text-slate-900 outline-none placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-slate-900/15",
  HUB_RADIUS.input
);

const iconRail = cn(
  "flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/95 text-slate-500 shadow-[0_4px_14px_-6px_rgba(15,23,42,0.1)]"
);

const glassRow = cn("flex items-center gap-3 transition-colors duration-300", HUB_SURFACE.fieldRow);

export default function RequesterProfilePanel() {
  const { profile, setProfile, validationFailedCount, currentStep, isSubmitting } =
    useRequesterHub();
  const {
    isAuthenticated,
    loading: accountLoading,
    fields: accountFields,
    updateField,
    persistAccount,
    handleSignOut,
    saving: accountSaving,
  } = useClientPortalAccount();
  const { t } = useTranslation();
  const { readiness, handleSubmit } = useRequesterInterventionForm();
  const shakeControls = useAnimation();
  useEffect(() => {
    if (validationFailedCount > 0) {
      shakeControls.start({
        x: [0, -6, 6, -6, 6, 0],
        transition: { duration: 0.4 },
      });
    }
  }, [validationFailedCount, shakeControls]);

  const handleTypeChange = (type: RequesterType) => {
    setProfile((prev) => ({ ...prev, type }));
  };

  const isInvalid = (val: string) => validationFailedCount > 0 && !val.trim();

  const onEnterSubmit = (e: KeyboardEvent) => {
    if (e.key !== "Enter" || e.shiftKey) return;
    if (currentStep !== 4) return;
    e.preventDefault();
    dispatchRequesterInterventionEnterSubmit();
  };

  const profileSubmitBlocked = Boolean(readiness.profileSubmitHintKey);
  const profileSubmitDisabled = isSubmitting || profileSubmitBlocked;

  return (
    <div data-testid="requester-profile-panel" className="flex min-h-0 min-w-0 flex-1 flex-col">
      <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-4">
        <HubSegmentedControl
          value={profile.type}
          onChange={(id) => handleTypeChange(id as RequesterType)}
          layout="scroll"
          size="compact"
          className="shrink-0"
          options={[
            {
              id: "login",
              label: t("requester.profile.type_login"),
              testId: "requester-type-login",
              activeAccent: "slate",
            },
            {
              id: "register",
              label: t("requester.profile.type_register"),
              testId: "requester-type-register",
              activeAccent: "slate",
            },
            {
              id: "particulier",
              label: t("requester.profile.type_individual"),
              testId: "requester-type-particulier",
              activeAccent: "slate",
            },
          ]}
        />

        {profile.type === "login" || profile.type === "register" ? (
          <div data-testid="requester-login-rail" className="flex min-h-0 flex-1 flex-col">
            {accountLoading && isAuthenticated ? (
              <div
                data-testid="requester-client-account-loading"
                className="flex flex-1 items-center justify-center py-10"
              >
                <span className="sr-only">{t("requester.account.loading")}</span>
              </div>
            ) : isAuthenticated ? (
              <RequesterClientAccountPanel
                fields={accountFields}
                updateField={updateField}
                persistAccount={persistAccount}
                handleSignOut={handleSignOut}
                saving={accountSaving}
                validationFailedCount={validationFailedCount}
                shakeControls={shakeControls}
              />
            ) : (
              <ClientPortalAuthPanel
                authRailMode
                authTab={profile.type === "register" ? "register" : "login"}
              />
            )}
          </div>
        ) : (
          <div className="flex min-h-0 flex-1 flex-col gap-4">
            <div className="flex flex-col gap-2.5 rounded-[24px] border border-black/[0.05] bg-white/70 p-3 shadow-[0_18px_44px_-28px_rgba(15,23,42,0.2)]">
              <motion.div
                animate={isInvalid(profile.firstName) ? shakeControls : undefined}
                className={cn(
                  glassRow,
                  isInvalid(profile.firstName) && "ring-2 ring-red-500 bg-red-50/80"
                )}
              >
                <span className={iconRail}>
                  <User
                    className={cn(
                      "h-5 w-5 opacity-70",
                      isInvalid(profile.firstName) && "text-red-500 opacity-100"
                    )}
                  />
                </span>
                <input
                  type="text"
                  placeholder={t("requester.profile.first_name")}
                  value={profile.firstName}
                  onKeyDown={onEnterSubmit}
                  onChange={(e) => setProfile((prev) => ({ ...prev, firstName: e.target.value }))}
                  className={cn(
                    inputClass,
                    isInvalid(profile.firstName) && "placeholder:text-red-300"
                  )}
                />
              </motion.div>

              <motion.div
                animate={isInvalid(profile.lastName) ? shakeControls : undefined}
                className={cn(
                  glassRow,
                  isInvalid(profile.lastName) && "ring-2 ring-red-500 bg-red-50/80"
                )}
              >
                <span className={iconRail}>
                  <User
                    className={cn(
                      "h-5 w-5 opacity-70",
                      isInvalid(profile.lastName) && "text-red-500 opacity-100"
                    )}
                  />
                </span>
                <input
                  type="text"
                  placeholder={t("requester.profile.last_name")}
                  value={profile.lastName}
                  onKeyDown={onEnterSubmit}
                  onChange={(e) => setProfile((prev) => ({ ...prev, lastName: e.target.value }))}
                  className={cn(
                    inputClass,
                    isInvalid(profile.lastName) && "placeholder:text-red-300"
                  )}
                />
              </motion.div>
            </div>

            <div className="flex flex-col gap-2.5 rounded-[24px] border border-black/[0.05] bg-white/70 p-3 shadow-[0_18px_44px_-28px_rgba(15,23,42,0.2)]">
              <motion.div
                animate={isInvalid(profile.phone) ? shakeControls : undefined}
                className={cn(
                  glassRow,
                  isInvalid(profile.phone) && "ring-2 ring-red-500 bg-red-50/80"
                )}
              >
                <span className={iconRail}>
                  <Phone
                    className={cn(
                      "h-5 w-5 opacity-70",
                      isInvalid(profile.phone) && "text-red-500 opacity-100"
                    )}
                  />
                </span>
                <input
                  type="tel"
                  placeholder={t("requester.profile.phone")}
                  value={profile.phone}
                  onKeyDown={onEnterSubmit}
                  onChange={(e) => setProfile((prev) => ({ ...prev, phone: e.target.value }))}
                  className={cn(inputClass, isInvalid(profile.phone) && "placeholder:text-red-300")}
                />
              </motion.div>

              <motion.div
                animate={isInvalid(profile.email) ? shakeControls : undefined}
                className={cn(
                  glassRow,
                  isInvalid(profile.email) && "ring-2 ring-red-500 bg-red-50/80"
                )}
              >
                <span className={iconRail}>
                  <Mail
                    className={cn(
                      "h-5 w-5 opacity-70",
                      isInvalid(profile.email) && "text-red-500 opacity-100"
                    )}
                  />
                </span>
                <input
                  type="email"
                  placeholder={t("requester.profile.email_required")}
                  value={profile.email}
                  onKeyDown={onEnterSubmit}
                  onChange={(e) => setProfile((prev) => ({ ...prev, email: e.target.value }))}
                  className={cn(inputClass, isInvalid(profile.email) && "placeholder:text-red-300")}
                />
              </motion.div>
            </div>

            <div className="shrink-0 pb-1 pt-1">
              <button
                type="button"
                data-testid="requester-profile-submit-btn"
                disabled={profileSubmitDisabled}
                onClick={() => void handleSubmit()}
                className="mx-auto flex w-full max-w-none min-h-[52px] items-center justify-center gap-2 rounded-[16px] bg-black px-6 py-5 text-base font-bold text-white transition hover:bg-slate-900 active:scale-[0.98] disabled:bg-slate-300 disabled:text-slate-500 disabled:opacity-100 disabled:hover:bg-slate-300 disabled:active:scale-100"
              >
                {isSubmitting ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    <SendHorizontal className="h-5 w-5" />
                    {String(t("requester.intervention.submit_request"))}
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
