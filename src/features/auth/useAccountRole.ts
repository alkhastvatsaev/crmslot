"use client";
import { useEffect, useState } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { collection, doc, getDoc, getDocs, limit, query, where } from "firebase/firestore";
import { auth, clientPortalFirestore, firestore, isConfigured } from "@/core/config/firebase";
import { CLIENT_PORTAL_PROFILE_COLLECTION } from "@/features/auth/clientPortalConstants";
import { isCrmTenantAuthUser } from "@/features/auth/recoverMainAuthFromClientPortalLeak";

export type AccountRole = "admin" | "technician" | "client" | "unknown";

export type AccountRoleState = {
  role: AccountRole;
  isTechnicianAccount: boolean;
  isClientPortalAccount: boolean;
  isCrmTenantAccount: boolean;
  isLoading: boolean;
};

const DEFAULT_STATE: AccountRoleState = {
  role: "unknown",
  isTechnicianAccount: false,
  isClientPortalAccount: false,
  isCrmTenantAccount: false,
  isLoading: true,
};

async function withTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((resolve) => {
      setTimeout(() => resolve(fallback), ms);
    }),
  ]);
}

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

async function hasCompanyMembership(uid: string): Promise<boolean> {
  if (!isConfigured || !firestore) return false;
  try {
    const snap = await getDocs(collection(firestore, "users", uid, "company_memberships"));
    return !snap.empty;
  } catch {
    return false;
  }
}

async function resolveCrmTenantAccount(user: User): Promise<boolean> {
  if (user.isAnonymous) return false;
  try {
    const token = await user.getIdTokenResult();
    if (isCrmTenantAuthUser(user, token.claims as Record<string, unknown>)) return true;
  } catch {
    /* ignore */
  }
  return hasCompanyMembership(user.uid);
}

/** Détecte technicien terrain vs portail client vs admin back-office. */
export function useAccountRole(): AccountRoleState {
  const [state, setState] = useState<AccountRoleState>(DEFAULT_STATE);

  useEffect(() => {
    if (!isConfigured || !auth || !firestore) {
      setState({
        role: "unknown",
        isTechnicianAccount: false,
        isClientPortalAccount: false,
        isCrmTenantAccount: false,
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
          isCrmTenantAccount: false,
          isLoading: false,
        });
        return;
      }
      setState((prev) => ({ ...prev, isLoading: true }));
      try {
        const [techSnap, isClient, isCrmTenant] = await withTimeout(
          Promise.all([
            getDocs(
              query(
                collection(firestore!, "technicians"),
                where("authUid", "==", user.uid),
                limit(1)
              )
            ),
            hasClientPortalProfile(user.uid),
            resolveCrmTenantAccount(user),
          ]),
          10_000,
          [null, false, true] as [Awaited<ReturnType<typeof getDocs>> | null, boolean, boolean]
        );
        if (cancelled) return;
        const isTech = techSnap !== null && !techSnap.empty;
        const satelliteTechnician = isTech && !isCrmTenant;
        const satelliteClient = isClient && !isTech && !isCrmTenant;
        const role: AccountRole = isCrmTenant
          ? "admin"
          : isTech
            ? "technician"
            : isClient
              ? "client"
              : "admin";
        setState({
          role,
          isTechnicianAccount: satelliteTechnician,
          isClientPortalAccount: satelliteClient,
          isCrmTenantAccount: isCrmTenant,
          isLoading: false,
        });
      } catch {
        if (cancelled) return;
        setState({
          role: "unknown",
          isTechnicianAccount: false,
          isClientPortalAccount: false,
          isCrmTenantAccount: false,
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
