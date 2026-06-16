"use client";

import React, { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { auth, isConfigured } from "@/core/config/firebase";
import { logger } from "@/core/logger";
import { ensureNativeAuthPersistence } from "@/core/native/nativeAuthPersistence";
import TechnicianLoginPanel from "@/features/auth/components/TechnicianLoginPanel";

type GatePhase = "checking" | "login" | "ready";

function resolveGatePhase(user: User | null): GatePhase {
  if (!isConfigured || !auth) return "ready";
  if (user && !user.isAnonymous) return "ready";
  return "login";
}

/** Auth terrain : connexion e-mail / mot de passe (auth CRM). */
export default function TechnicianLoginGate({ children }: { children: React.ReactNode }) {
  const [phase, setPhase] = useState<GatePhase>("checking");

  useEffect(() => {
    if (!auth) {
      setPhase("ready");
      return;
    }

    void ensureNativeAuthPersistence(auth);

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setPhase(resolveGatePhase(user));
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
