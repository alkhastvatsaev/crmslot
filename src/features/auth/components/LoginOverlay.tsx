"use client";
import React, { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { auth } from "@/core/config/firebase";
import { logger } from "@/core/logger";
import { onAuthStateChanged, signInAnonymously, signInWithEmailAndPassword } from "firebase/auth";

import { devUiPreviewEnabled } from "@/core/config/devUiPreview";
import { isCapacitorNative } from "@/core/native/capacitorRuntime";

const NATIVE_DEMO_EMAIL = "demo@crmslot.app";
const NATIVE_DEMO_PASSWORD = "Demo1234!";

export default function LoginOverlay({ children }: { children: React.ReactNode }) {
  const [loadingState, setLoadingState] = useState<"checking" | "ready">("checking");
  const [, setIsAuthenticated] = useState(false);

  useEffect(() => {
    if (!auth) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLoadingState("ready");
      return;
    }

    if (devUiPreviewEnabled) {
      if (!auth.currentUser) {
        signInAnonymously(auth).catch((e: unknown) => {
          logger.warn("[LoginOverlay] dev anonymous sign-in failed", {
            error: e instanceof Error ? e.message : String(e),
          });
        });
      }
      setIsAuthenticated(true);
      setLoadingState("ready");
      return;
    }

    const unsubscribe = onAuthStateChanged(auth!, async (user) => {
      if (user) {
        setIsAuthenticated(true);
        setLoadingState("ready");
      } else {
        try {
          if (isCapacitorNative()) {
            await signInWithEmailAndPassword(auth!, NATIVE_DEMO_EMAIL, NATIVE_DEMO_PASSWORD);
          } else {
            await signInAnonymously(auth!);
          }
          setIsAuthenticated(true);
          setLoadingState("ready");
        } catch (e) {
          logger.error("[LoginOverlay] Sign-in failed", {
            error: e instanceof Error ? e.message : String(e),
          });
          // If sign-in fails (e.g. offline), we still let them in for the demo UI
          setIsAuthenticated(true);
          setLoadingState("ready");
        }
      }
    });

    return () => unsubscribe();
  }, []);

  if (loadingState === "checking") {
    return (
      <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-slate-50">
        <Loader2 className="h-10 w-10 animate-spin text-blue-600" strokeWidth={1.5} />
      </div>
    );
  }

  // En mode démo "ouverture directe", on ne montre plus d'overlay de connexion.
  // L'authentification se fait silencieusement en arrière-plan.
  return <>{children}</>;
}
