"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { collection, limit, onSnapshot, query, where } from "firebase/firestore";
import { auth, firestore, isConfigured } from "@/core/config/firebase";
import type { Technician } from "@/features/technicians";
import { withTechnicianAuthUid } from "@/features/technicians/withTechnicianAuthUid";

/** Profil technicien connecté — requête par authUid (comptes terrain sans membership société). */
export function useTechnicianSelfProfile(enabled = true) {
  const [selfTechnician, setSelfTechnician] = useState<Technician | null>(null);
  const [loading, setLoading] = useState(enabled);

  useEffect(() => {
    if (!enabled || !isConfigured || !firestore || !auth) {
      setSelfTechnician(null);
      setLoading(false);
      return () => {};
    }

    let unsubscribeProfile: (() => void) | undefined;

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      unsubscribeProfile?.();
      unsubscribeProfile = undefined;

      if (!user) {
        setSelfTechnician(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      const profileQuery = query(
        collection(firestore!, "technicians"),
        where("authUid", "==", user.uid),
        limit(1)
      );

      unsubscribeProfile = onSnapshot(
        profileQuery,
        (snapshot) => {
          const doc = snapshot.docs[0];
          setSelfTechnician(
            doc ? withTechnicianAuthUid({ ...doc.data(), id: doc.id } as Technician) : null
          );
          setLoading(false);
        },
        () => {
          setSelfTechnician(null);
          setLoading(false);
        }
      );
    });

    return () => {
      unsubscribeAuth();
      unsubscribeProfile?.();
    };
  }, [enabled]);

  return { selfTechnician, loading };
}
