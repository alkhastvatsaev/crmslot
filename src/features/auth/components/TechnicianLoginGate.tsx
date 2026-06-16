"use client";

import React, { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { onAuthStateChanged, signInAnonymously, type User } from "firebase/auth";
import { auth, isConfigured } from "@/core/config/firebase";
import { devUiPreviewEnabled } from "@/core/config/devUiPreview";
import { logger } from "@/core/logger";
import { isCapacitorNative } from "@/core/native/capacitorRuntime";
import { ensureNativeAuthPersistence } from "@/core/native/nativeAuthPersistence";
import { signInTechnicianWithEmail } from "@/features/auth/technicianEmailSignIn";
import TechnicianLoginPanel from "@/features/auth/components/TechnicianLoginPanel";

const NATIVE_DEMO_EMAIL = "demo@crmslot.app";
const NATIVE_DEMO_PASSWORD = "Demo1234!";

type GatePhase = "checking" | "login" | "ready";

function resolveGatePhase(user: User | null): GatePhase {
  if (!isConfigured || !auth) return "ready";
  if (devUiPreviewEnabled) return "ready";
  if (user && !user.isAnonymous) return "ready";
  return "login";
}

/**
 * Auth terrain : connexion e-mail / mot de passe (auth CRM).
 * En dev / staging preview, conserve le flux anonyme hérité de LoginOverlay.
 */
export default function TechnicianLoginGate({ children }: { children: React.ReactNode }) {
  const [phase, setPhase] = useState<GatePhase>("checking");

  useEffect(() => {
    if (!auth) {
      setPhase("ready");
      return;
    }

    void ensureNativeAuthPersistence(auth);

    if (devUiPreviewEnabled) {
      if (!auth.currentUser) {
        signInAnonymously(auth).catch((e: unknown) => {
          logger.warn("[TechnicianLoginGate] dev anonymous sign-in failed", {
            error: e instanceof Error ? e.message : String(e),
          });
        });
      }
      setPhase("ready");
      return;
    }

    let autoLoginAttempted = false;
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      const next = resolveGatePhase(user);
      if (next === "login" && isCapacitorNative() && !autoLoginAttempted) {
        autoLoginAttempted = true;
        signInTechnicianWithEmail({
          auth: auth!,
          email: NATIVE_DEMO_EMAIL,
          password: NATIVE_DEMO_PASSWORD,
        }).catch((e: unknown) => {
          logger.warn("[TechnicianLoginGate] native demo auto-login failed", {
            error: e instanceof Error ? e.message : String(e),
          });
          setPhase("login");
        });
        return;
      }
      setPhase(next);
    });

    return () => unsubscribe();
  }, []);

  if (phase === "checking") {
    return (
      <div
        data-testid="technician-login-gate-loading"
        className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-50"
      >
        <Loader2 className="h-10 w-10 animate-spin text-blue-600" strokeWidth={1.5} />
      </div>
    );
  }

  if (phase === "login") {
    return <TechnicianLoginPanel />;
  }

  return <>{children}</>;
}
