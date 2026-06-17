"use client";

import React, { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { auth, isConfigured } from "@/core/config/firebase";
import { ensureNativeAuthPersistence } from "@/core/native/nativeAuthPersistence";
import CrmEmailLoginPanel from "@/features/auth/components/CrmEmailLoginPanel";
import CrmStaffAuthEffects from "@/features/auth/components/CrmStaffAuthEffects";
import {
  crmEmailLoginTestId,
  type CrmEmailLoginVariant,
} from "@/features/auth/crmEmailLoginVariant";

type GatePhase = "checking" | "login" | "ready";

function resolveGatePhase(user: User | null): GatePhase {
  if (!isConfigured || !auth) return "ready";
  if (user && !user.isAnonymous) return "ready";
  return "login";
}

type Props = {
  variant: CrmEmailLoginVariant;
  children: React.ReactNode;
};

/** Auth CRM e-mail / mot de passe — technicien ou admin. */
export default function CrmEmailLoginGate({ variant, children }: Props) {
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
        data-testid={crmEmailLoginTestId(variant, "gate-loading")}
        className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-50"
      >
        <Loader2 className="h-10 w-10 animate-spin text-blue-600" strokeWidth={1.5} />
      </div>
    );
  }

  if (phase === "login") {
    return (
      <>
        <CrmStaffAuthEffects />
        <CrmEmailLoginPanel variant={variant} />
      </>
    );
  }

  return (
    <>
      <CrmStaffAuthEffects />
      {children}
    </>
  );
}
