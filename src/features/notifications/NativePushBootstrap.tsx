"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { onAuthStateChanged, type User } from "firebase/auth";
import { auth, clientPortalAuth } from "@/core/config/firebase";
import { useNativePushRegistration } from "@/features/notifications/useNativePushRegistration";
import { registerNativePushClickHandler } from "@/core/native/nativePushClickHandler";
import { registerNativePushForegroundHandler } from "@/core/native/nativePushForeground";
import { resolveNativePushAudience } from "@/features/notifications/resolveNativePushAudience";

function wrap(
  rawAuth: typeof auth | typeof clientPortalAuth
): { onAuthStateChanged: (cb: (user: User | null) => void) => () => void } | null {
  if (!rawAuth) return null;
  return {
    onAuthStateChanged: (cb) => onAuthStateChanged(rawAuth, cb),
  };
}

export default function NativePushBootstrap() {
  const pathname = usePathname();
  const audience = resolveNativePushAudience(pathname);
  const portalAudience = audience === "client";
  const authBinding = portalAudience ? wrap(clientPortalAuth) : wrap(auth);

  useNativePushRegistration({ audience, auth: authBinding });

  useEffect(() => {
    let unlistenClick: (() => void) | null = null;
    let unlistenForeground: (() => void) | null = null;
    void registerNativePushClickHandler().then((fn) => {
      unlistenClick = fn;
    });
    void registerNativePushForegroundHandler().then((fn) => {
      unlistenForeground = fn;
    });
    return () => {
      unlistenClick?.();
      unlistenForeground?.();
    };
  }, []);

  return null;
}
