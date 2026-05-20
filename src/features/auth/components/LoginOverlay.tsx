"use client";
import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { auth } from '@/core/config/firebase';
import { onAuthStateChanged, signInAnonymously } from 'firebase/auth';

import { syncClientPortalProfile } from '@/features/auth/clientPortalProfile';
import { devUiPreviewEnabled } from '@/core/config/devUiPreview';

export default function LoginOverlay({ children }: { children: React.ReactNode }) {
  const [loadingState, setLoadingState] = useState<'checking' | 'ready'>('checking');
  const [, setIsAuthenticated] = useState(false);


  useEffect(() => {
    if (!auth) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLoadingState('ready');
      return;
    }

    if (devUiPreviewEnabled) {
      void (async () => {
        try {
          if (!auth.currentUser) await signInAnonymously(auth);
        } catch (e) {
          console.warn("[LoginOverlay] dev anonymous sign-in failed", e);
        }
        setIsAuthenticated(true);
        setLoadingState('ready');
      })();
      return;
    }

    const unsubscribe = onAuthStateChanged(auth!, async (user) => {
      if (user) {
        try {
          await syncClientPortalProfile(user);
        } catch (e) {
          console.error("[LoginOverlay] sync error", e);
        }
        setIsAuthenticated(true);
        setLoadingState('ready');
      } else {
        try {
          const cred = await signInAnonymously(auth!);
          await syncClientPortalProfile(cred.user);
          setIsAuthenticated(true);
          setLoadingState('ready');
        } catch (e) {
          console.error("[LoginOverlay] Anonymous sign-in failed", e);
          // If anonymous fails (e.g. offline), we still let them in for the demo UI
          setIsAuthenticated(true);
          setLoadingState('ready');
        }
      }
    });

    return () => unsubscribe();
  }, []);

  if (loadingState === 'checking') {
    return (
      <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#f8fafc]">
        <Loader2 className="h-10 w-10 animate-spin text-blue-600" strokeWidth={1.5} />
      </div>
    );
  }

  // En mode démo "ouverture directe", on ne montre plus d'overlay de connexion.
  // L'authentification se fait silencieusement en arrière-plan.
  return <>{children}</>;
}
