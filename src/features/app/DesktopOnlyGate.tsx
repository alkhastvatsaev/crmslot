"use client";

import React, { useEffect, useState } from "react";
import { devUiPreviewEnabled } from "@/core/config/devUiPreview";
import { mobileAccessAllowed } from "@/core/config/mobileAccess";

/** Détection PWA / navigateur sur téléphone (Android, iPhone, iPod). iPad exclu pour usage tablette large. */
export function isPhoneClassDevice(): boolean {
  if (typeof window === "undefined") return false;
  const ua = navigator.userAgent || "";
  if (/Android/i.test(ua) && !/Tablet/i.test(ua)) return true;
  if (/iPhone|iPod/i.test(ua)) return true;
  return false;
}

export default function DesktopOnlyGate({ children }: { children: React.ReactNode }) {
  const bypassGate = devUiPreviewEnabled || mobileAccessAllowed;
  const [desktopOk, setDesktopOk] = useState<boolean | null>(() => (bypassGate ? true : null));

  useEffect(() => {
    if (bypassGate) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDesktopOk(!isPhoneClassDevice());
  }, [bypassGate]);

  if (bypassGate) {
    return <>{children}</>;
  }

  if (desktopOk === null) {
    return (
      <div
        data-testid="desktop-only-gate-loading"
        className="flex min-h-dvh items-center justify-center bg-[#f8fafc]"
      >
        <div
          className="h-9 w-9 animate-spin rounded-full border-2 border-slate-200 border-t-slate-600"
          aria-hidden
        />
      </div>
    );
  }

  if (!desktopOk) {
    return (
      <div
        data-testid="desktop-only-gate-blocked"
        className="flex min-h-dvh flex-col items-center justify-center gap-3 bg-[#f8fafc] px-6 text-center"
      >
        <p className="text-lg font-semibold text-slate-800">Version desktop uniquement</p>
        <p className="max-w-md text-sm leading-relaxed text-slate-600">
          Cette version est optimisée pour ordinateur et tablette. Pour tester sur téléphone en
          staging, définissez <code className="text-xs">NEXT_PUBLIC_ALLOW_MOBILE=true</code>.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
