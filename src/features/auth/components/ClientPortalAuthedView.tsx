"use client";

import Image from "next/image";
import { signOut, type User } from "firebase/auth";
import { Building2, LayoutDashboard, LogOut } from "lucide-react";
import { clientPortalAuth } from "@/core/config/firebase";
import { useTranslation } from "@/core/i18n/I18nContext";

const LOGO_URL = process.env.NEXT_PUBLIC_CLIENT_PORTAL_LOGO_URL?.trim();

type Props = {
  user: User;
  onGoDashboard: () => void | Promise<void>;
};

export default function ClientPortalAuthedView({ user, onGoDashboard }: Props) {
  const { t } = useTranslation();

  return (
    <div
      data-testid="client-portal-authed"
      className="flex flex-col items-center gap-4 rounded-[24px] border border-black/[0.06] bg-gradient-to-b from-white/95 to-white/82 px-5 py-8 shadow-[0_20px_50px_-24px_rgba(15,23,42,0.16)] backdrop-blur-xl"
    >
      {LOGO_URL ? (
        <Image
          src={LOGO_URL}
          alt=""
          width={200}
          height={56}
          className="h-14 w-auto max-w-[200px] object-contain"
        />
      ) : (
        <Building2 className="h-11 w-11 text-slate-400" aria-hidden />
      )}
      <span className="sr-only">
        {t("auth.session")} {user.email ?? user.uid}
      </span>
      <div className="mt-2 flex w-full flex-wrap justify-center gap-2">
        <button
          type="button"
          data-testid="client-portal-dashboard"
          onClick={() => void onGoDashboard()}
          className="inline-flex min-w-[140px] flex-1 items-center justify-center gap-2 rounded-[14px] bg-slate-900 px-4 py-3 text-[14px] font-bold text-white shadow-[0_12px_28px_-10px_rgba(15,23,42,0.35)] transition-transform active:scale-95"
        >
          <LayoutDashboard className="h-4 w-4 shrink-0" aria-hidden />
          {t("auth.dashboard")}
        </button>
        <button
          type="button"
          data-testid="client-portal-signout"
          onClick={() => {
            if (clientPortalAuth) void signOut(clientPortalAuth);
          }}
          className="inline-flex min-w-[140px] flex-1 items-center justify-center gap-2 rounded-[14px] border border-black/[0.08] bg-white px-4 py-3 text-[14px] font-bold text-slate-700 transition-all hover:bg-slate-50 active:scale-95"
        >
          <LogOut className="h-4 w-4 shrink-0" aria-hidden />
          {t("auth.signout")}
        </button>
      </div>
    </div>
  );
}
