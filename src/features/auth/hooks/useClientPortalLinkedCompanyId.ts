"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { clientPortalAuth, clientPortalFirestore, isConfigured } from "@/core/config/firebase";
import { CLIENT_PORTAL_PROFILE_COLLECTION } from "@/features/auth/clientPortalConstants";
import { isVerifiedClientPortalUser } from "@/features/auth/hooks/useClientPortalAccount";

/** `companyId` du profil portail client — pour chat IVANA et demandes. */
export function useClientPortalLinkedCompanyId(): string | null {
  const [companyId, setCompanyId] = useState<string | null>(null);

  useEffect(() => {
    if (!isConfigured || !clientPortalAuth || !clientPortalFirestore) {
      setCompanyId(null);
      return;
    }

    let unsubProfile: (() => void) | undefined;
    const portalDb = clientPortalFirestore;

    const unsubAuth = onAuthStateChanged(clientPortalAuth, (user) => {
      unsubProfile?.();
      unsubProfile = undefined;

      if (!isVerifiedClientPortalUser(user)) {
        setCompanyId(null);
        return;
      }

      const ref = doc(portalDb, CLIENT_PORTAL_PROFILE_COLLECTION, user.uid);
      unsubProfile = onSnapshot(
        ref,
        (snap) => {
          const raw = snap.data()?.companyId;
          setCompanyId(typeof raw === "string" && raw.trim() ? raw.trim() : null);
        },
        () => setCompanyId(null)
      );
    });

    return () => {
      unsubAuth();
      unsubProfile?.();
    };
  }, []);

  return companyId;
}
