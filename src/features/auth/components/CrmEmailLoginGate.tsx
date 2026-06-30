"use client";

import React, { useEffect, useState } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import AppBootLoadingScreen from "@/core/ui/AppBootLoadingScreen";
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
  if (!isConfigured || !auth) {
    return process.env.NODE_ENV === "production" ? "login" : "ready";
  }
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

    const failSafe = setTimeout(() => {
      setPhase(resolveGatePhase(auth?.currentUser ?? null));
    }, 3500);

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      clearTimeout(failSafe);
      setPhase(resolveGatePhase(user));
    });

    return () => {
      clearTimeout(failSafe);
      unsubscribe();
    };
  }, []);

  if (phase === "checking") {
    return (
      <AppBootLoadingScreen variant="fixed" testId={crmEmailLoginTestId(variant, "gate-loading")} />
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
