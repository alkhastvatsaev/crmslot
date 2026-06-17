"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged, signOut, type User } from "firebase/auth";
import { auth } from "@/core/config/firebase";
import { useCompanyWorkspaceOptional } from "@/context/CompanyWorkspaceContext";

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
  workspace: ReturnType<typeof useCompanyWorkspaceOptional>
): CrmStaffAccountFields {
  const { firstName, lastName } = splitDisplayName(user?.displayName ?? "");
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
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    if (!auth) return () => {};
    return onAuthStateChanged(auth, (next) => setUser(next));
  }, []);

  const fields = resolveStaffAccountFields(user, workspace);

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
