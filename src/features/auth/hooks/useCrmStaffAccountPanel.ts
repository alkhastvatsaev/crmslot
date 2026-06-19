"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged, signOut, type User } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { auth, firestore } from "@/core/config/firebase";
import { useCompanyWorkspaceOptional } from "@/context/CompanyWorkspaceContext";

type TechnicianFirestoreProfile = {
  firstName: string;
  lastName: string;
};

export type CrmStaffAccountFields = {
  email: string;
  firstName: string;
  lastName: string;
  companyName: string;
  roleLabel: string | null;
};

function splitDisplayName(displayName: string): { firstName: string; lastName: string } {
  const parts = displayName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { firstName: "", lastName: "" };
  if (parts.length === 1) return { firstName: parts[0], lastName: "" };
  return { firstName: parts[0], lastName: parts.slice(1).join(" ") };
}

function resolveStaffAccountFields(
  user: User | null,
  workspace: ReturnType<typeof useCompanyWorkspaceOptional>,
  technicianProfile: TechnicianFirestoreProfile | null
): CrmStaffAccountFields {
  const fromAuth = splitDisplayName(user?.displayName ?? "");
  const firstName = (technicianProfile?.firstName || fromAuth.firstName).trim();
  const lastName = (technicianProfile?.lastName || fromAuth.lastName).trim();
  const membership = workspace?.memberships.find((m) => m.companyId === workspace.activeCompanyId);
  return {
    email: user?.email?.trim() ?? "",
    firstName,
    lastName,
    companyName: membership?.companyName?.trim() || "—",
    roleLabel: workspace?.activeRole ?? membership?.role ?? null,
  };
}

export function useCrmStaffAccountPanel() {
  const workspace = useCompanyWorkspaceOptional();
  const [user, setUser] = useState<User | null>(auth?.currentUser ?? null);
  const [technicianProfile, setTechnicianProfile] = useState<TechnicianFirestoreProfile | null>(
    null
  );
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    if (!auth) return () => {};
    return onAuthStateChanged(auth, (next) => setUser(next));
  }, []);

  useEffect(() => {
    const uid = user?.uid?.trim();
    if (!firestore || !uid) {
      setTechnicianProfile(null);
      return () => {};
    }

    const ref = doc(firestore, "technicians", uid);
    return onSnapshot(
      ref,
      (snap) => {
        if (!snap.exists()) {
          setTechnicianProfile(null);
          return;
        }
        const data = snap.data();
        setTechnicianProfile({
          firstName: typeof data.firstName === "string" ? data.firstName.trim() : "",
          lastName: typeof data.lastName === "string" ? data.lastName.trim() : "",
        });
      },
      () => setTechnicianProfile(null)
    );
  }, [user?.uid]);

  const fields = resolveStaffAccountFields(user, workspace, technicianProfile);

  const handleSignOut = async () => {
    if (!auth || signingOut) return;
    setSigningOut(true);
    try {
      await signOut(auth);
    } finally {
      setSigningOut(false);
    }
  };

  return {
    fields,
    ready: Boolean(user),
    signingOut,
    handleSignOut,
  };
}
