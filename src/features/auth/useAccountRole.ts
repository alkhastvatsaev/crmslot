"use client";
import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { collection, getDocs, limit, query, where } from "firebase/firestore";
import { auth, firestore, isConfigured } from "@/core/config/firebase";
import { devUiPreviewEnabled } from "@/core/config/devUiPreview";

export type AccountRole = "admin" | "technician" | "client" | "unknown";

export type AccountRoleState = {
  /** Rôle principal détecté pour cet utilisateur. Sert au filtrage UI. */
  role: AccountRole;
  /** True si l'utilisateur est référencé dans la collection `technicians`. */
  isTechnicianAccount: boolean;
  /** En cours de résolution (Firebase Auth + Firestore lookup). */
  isLoading: boolean;
};

const DEFAULT_STATE: AccountRoleState = {
  role: "unknown",
  isTechnicianAccount: false,
  isLoading: true,
};

/**
 * Détecte si le compte courant est un technicien (présence dans `technicians.authUid`).
 * Utilisé par le dashboard pour ne pas mounter les pages admin pour un technicien.
 *
 * Volontairement minimaliste : pas de membership multi-société ici, juste binaire
 * « technicien terrain » vs « le reste ».
 */
export function useAccountRole(): AccountRoleState {
  const [state, setState] = useState<AccountRoleState>(() =>
    devUiPreviewEnabled
      ? { role: "admin", isTechnicianAccount: false, isLoading: false }
      : DEFAULT_STATE
  );

  useEffect(() => {
    if (devUiPreviewEnabled) return;
    if (!isConfigured || !auth || !firestore) {
      setState({ role: "admin", isTechnicianAccount: false, isLoading: false });
      return;
    }

    let cancelled = false;
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (cancelled) return;
      if (!user) {
        setState({ role: "unknown", isTechnicianAccount: false, isLoading: false });
        return;
      }
      setState((prev) => ({ ...prev, isLoading: true }));
      try {
        const snap = await getDocs(
          query(collection(firestore!, "technicians"), where("authUid", "==", user.uid), limit(1))
        );
        if (cancelled) return;
        const isTech = !snap.empty;
        setState({
          role: isTech ? "technician" : "admin",
          isTechnicianAccount: isTech,
          isLoading: false,
        });
      } catch {
        if (cancelled) return;
        setState({ role: "admin", isTechnicianAccount: false, isLoading: false });
      }
    });

    return () => {
      cancelled = true;
      unsub();
    };
  }, []);

  return state;
}
