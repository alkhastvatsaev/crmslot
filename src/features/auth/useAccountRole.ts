"use client";
import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { collection, doc, getDoc, getDocs, limit, query, where } from "firebase/firestore";
import { auth, clientPortalFirestore, firestore, isConfigured } from "@/core/config/firebase";
import { devUiPreviewEnabled } from "@/core/config/devUiPreview";
import { CLIENT_PORTAL_PROFILE_COLLECTION } from "@/features/auth/clientPortalConstants";

export type AccountRole = "admin" | "technician" | "client" | "unknown";

export type AccountRoleState = {
  /** Rôle principal détecté pour cet utilisateur. Sert au filtrage UI. */
  role: AccountRole;
  /** True si l'utilisateur est référencé dans la collection `technicians`. */
  isTechnicianAccount: boolean;
  /** Profil portail client (`client_portal_profiles`) — redirect `/m/demande`. */
  isClientPortalAccount: boolean;
  /** En cours de résolution (Firebase Auth + Firestore lookup). */
  isLoading: boolean;
};

const DEFAULT_STATE: AccountRoleState = {
  role: "unknown",
  isTechnicianAccount: false,
  isClientPortalAccount: false,
  isLoading: true,
};

async function hasClientPortalProfile(uid: string): Promise<boolean> {
  if (!isConfigured || !clientPortalFirestore) return false;
  try {
    const snap = await getDoc(doc(clientPortalFirestore, CLIENT_PORTAL_PROFILE_COLLECTION, uid));
    if (!snap.exists()) return false;
    const role = snap.data()?.role;
    return typeof role !== "string" || role.trim() === "" || role === "client";
  } catch {
    return false;
  }
}

/**
 * Détecte technicien terrain vs portail client vs admin back-office.
 * Utilisé pour router vers `/m/technician`, `/m/demande` ou le dashboard admin.
 */
export function useAccountRole(): AccountRoleState {
  const [state, setState] = useState<AccountRoleState>(() =>
    devUiPreviewEnabled
      ? {
          role: "admin",
          isTechnicianAccount: false,
          isClientPortalAccount: false,
          isLoading: false,
        }
      : DEFAULT_STATE
  );

  useEffect(() => {
    if (devUiPreviewEnabled) return;
    if (!isConfigured || !auth || !firestore) {
      setState({
        role: "admin",
        isTechnicianAccount: false,
        isClientPortalAccount: false,
        isLoading: false,
      });
      return;
    }

    let cancelled = false;
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (cancelled) return;
      if (!user) {
        setState({
          role: "unknown",
          isTechnicianAccount: false,
          isClientPortalAccount: false,
          isLoading: false,
        });
        return;
      }
      setState((prev) => ({ ...prev, isLoading: true }));
      try {
        const [techSnap, isClient] = await Promise.all([
          getDocs(
            query(collection(firestore!, "technicians"), where("authUid", "==", user.uid), limit(1))
          ),
          hasClientPortalProfile(user.uid),
        ]);
        if (cancelled) return;
        const isTech = !techSnap.empty;
        const role: AccountRole = isTech ? "technician" : isClient ? "client" : "admin";
        setState({
          role,
          isTechnicianAccount: isTech,
          isClientPortalAccount: isClient && !isTech,
          isLoading: false,
        });
      } catch {
        if (cancelled) return;
        setState({
          role: "admin",
          isTechnicianAccount: false,
          isClientPortalAccount: false,
          isLoading: false,
        });
      }
    });

    return () => {
      cancelled = true;
      unsub();
    };
  }, []);

  return state;
}
