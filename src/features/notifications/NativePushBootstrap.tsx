"use client";

import { onAuthStateChanged, type User } from "firebase/auth";
import { auth, clientPortalAuth } from "@/core/config/firebase";
import { useNativePushRegistration } from "@/features/notifications/useNativePushRegistration";

function wrap(
  rawAuth: typeof auth | typeof clientPortalAuth
): { onAuthStateChanged: (cb: (user: User | null) => void) => () => void } | null {
  if (!rawAuth) return null;
  return {
    onAuthStateChanged: (cb) => onAuthStateChanged(rawAuth, cb),
  };
}

export default function NativePushBootstrap() {
  useNativePushRegistration({ audience: "technician", auth: wrap(auth) });
  useNativePushRegistration({ audience: "client", auth: wrap(clientPortalAuth) });
  return null;
}
