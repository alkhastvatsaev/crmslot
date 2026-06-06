"use client";

import { useEffect } from "react";
import { Building2, Mail, Phone, User, UserRound } from "lucide-react";
import ClientPortalAuthPanel from "@/features/auth/components/ClientPortalAuthPanel";
import { useRequesterHub, RequesterType } from "../context/RequesterHubContext";
import { GLASS_PANEL_BODY_SCROLL_COMPACT } from "@/core/ui/glassPanelChrome";
import { HUB_FONT_OUTFIT, HUB_RADIUS, HUB_SURFACE, HubSegmentedControl } from "@/core/ui/hub";
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
  const { profile, setProfile, validationFailedCount } = useRequesterHub();
  const { t } = useTranslation();
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

  return (
    <div
      data-testid="requester-profile-panel"
      className="flex min-h-0 flex-1 flex-col overflow-hidden"
    >
      <div className={`${GLASS_PANEL_BODY_SCROLL_COMPACT} flex flex-col gap-4`}>
        <HubSegmentedControl
          value={profile.type}
          onChange={(id) => handleTypeChange(id as RequesterType)}
          size="compact"
          className="shrink-0"
          options={[
            {
              id: "login",
              label: t("requester.profile.type_login"),
              testId: "requester-type-login",
              icon: <Building2 className="h-4 w-4" />,
              activeAccent: "slate",
            },
            {
              id: "particulier",
              label: t("requester.profile.type_individual"),
              testId: "requester-type-particulier",
              icon: <UserRound className="h-4 w-4" />,
              activeAccent: "slate",
            },
          ]}
        />

        {profile.type === "login" ? (
          <div
            data-testid="requester-login-rail"
            className="min-h-0 flex-1 flex flex-col overflow-hidden"
          >
            <ClientPortalAuthPanel authRailMode />
          </div>
        ) : (
          <>
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
                  placeholder="Mail"
                  value={profile.email}
                  onChange={(e) => setProfile((prev) => ({ ...prev, email: e.target.value }))}
                  className={cn(inputClass, isInvalid(profile.email) && "placeholder:text-red-300")}
                />
              </motion.div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
