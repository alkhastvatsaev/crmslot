"use client";

import { useEffect } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { auth, clientPortalAuth } from "@/core/config/firebase";
import { useNativePushRegistration } from "@/features/notifications/useNativePushRegistration";
import { registerNativePushClickHandler } from "@/core/native/nativePushClickHandler";

function wrap(
  rawAuth: typeof auth | typeof clientPortalAuth
): { onAuthStateChanged: (cb: (user: User | null) => void) => () => void } | null {
  if (!rawAuth) return null;
  return {
    onAuthStateChanged: (cb) => onAuthStateChanged(rawAuth, cb),
  };
}

export default function NativePushBootstrap() {
  // L'app native cible le terrain (technicien) et le portail client. L'admin reste
  // sur PWA web — son token FCM est enregistré par BackofficePushBootstrap.
  // (Si une app native admin apparaît, exposer `audience: "backoffice"` ici via un
  // mount conditionnel — sinon le token tech serait écrasé sur le même device.)
  useNativePushRegistration({ audience: "technician", auth: wrap(auth) });
  useNativePushRegistration({ audience: "client", auth: wrap(clientPortalAuth) });

  useEffect(() => {
    let unlisten: (() => void) | null = null;
    void registerNativePushClickHandler().then((fn) => {
      unlisten = fn;
    });
    return () => {
      unlisten?.();
    };
  }, []);

  return null;
}
