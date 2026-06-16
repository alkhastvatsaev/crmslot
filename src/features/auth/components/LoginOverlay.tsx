"use client";
import React, { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { auth } from "@/core/config/firebase";
import { logger } from "@/core/logger";
import { onAuthStateChanged } from "firebase/auth";
import { ensureNativeAuthPersistence } from "@/core/native/nativeAuthPersistence";

export default function LoginOverlay({ children }: { children: React.ReactNode }) {
  const [loadingState, setLoadingState] = useState<"checking" | "ready">("checking");

  useEffect(() => {
    if (!auth) {
      setLoadingState("ready");
      return;
    }

    void ensureNativeAuthPersistence(auth);

    const unsubscribe = onAuthStateChanged(auth, () => {
      setLoadingState("ready");
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

  return <>{children}</>;
}
