"use client";

import { useCallback, useEffect, useState } from "react";
import { onAuthStateChanged, signOut, type User } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { toast } from "sonner";
import { auth, firestore } from "@/core/config/firebase";
import { useCompanyWorkspaceOptional } from "@/context/CompanyWorkspaceContext";
import { useTranslation } from "@/core/i18n/I18nContext";
import type { CompanyMembershipRow, CompanyRole } from "@/features/company";
import {
  deleteStaffAccount,
  saveStaffAccountProfile,
  type StaffAccountDraft,
} from "@/features/auth/staffAccountProfile";

type TechnicianFirestoreProfile = {
  firstName: string;
  lastName: string;
  phone: string;
};

export type CrmStaffAccountFields = {
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  companyId: string;
  companyName: string;
  roleLabel: CompanyRole | null;
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
  const membership =
    workspace?.memberships.find((m) => m.companyId === workspace.activeCompanyId) ??
    workspace?.memberships[0];
  const activeCompanyId = workspace?.activeCompanyId?.trim() || membership?.companyId?.trim() || "";
  return {
    email: user?.email?.trim() ?? "",
    firstName,
    lastName,
    phone: technicianProfile?.phone?.trim() ?? "",
    companyId: activeCompanyId,
    companyName: membership?.companyName?.trim() || "—",
    roleLabel:
      workspace?.activeRole ??
      workspace?.memberships.find((m) => m.companyId === activeCompanyId)?.role ??
      membership?.role ??
      null,
  };
}

function draftFromFields(
  fields: CrmStaffAccountFields,
  memberships: CompanyMembershipRow[]
): StaffAccountDraft {
  const membership = memberships.find((m) => m.companyId === fields.companyId) ?? memberships[0];
  return {
    firstName: fields.firstName,
    lastName: fields.lastName,
    email: fields.email,
    phone: fields.phone,
    companyId: membership?.companyId ?? fields.companyId,
    role: membership?.role ?? fields.roleLabel ?? "collaborateur",
  };
}

export function useCrmStaffAccountPanel() {
  const { t } = useTranslation();
  const workspace = useCompanyWorkspaceOptional();
  const [user, setUser] = useState<User | null>(auth?.currentUser ?? null);
  const [technicianProfile, setTechnicianProfile] = useState<TechnicianFirestoreProfile | null>(
    null
  );
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<StaffAccountDraft>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    companyId: "",
    role: "collaborateur",
  });
  const [signingOut, setSigningOut] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

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
          phone: typeof data.phone === "string" ? data.phone.trim() : "",
        });
      },
      () => setTechnicianProfile(null)
    );
  }, [user?.uid]);

  const memberships = workspace?.memberships ?? [];
  const fields = resolveStaffAccountFields(user, workspace, technicianProfile);

  const startEditing = useCallback(() => {
    setDraft(draftFromFields(fields, memberships));
    setEditing(true);
  }, [fields, memberships]);

  const cancelEditing = useCallback(() => {
    setEditing(false);
  }, []);

  const updateDraft = useCallback((patch: Partial<StaffAccountDraft>) => {
    setDraft((prev) => ({ ...prev, ...patch }));
  }, []);

  const handleCompanyChange = useCallback(
    (companyId: string) => {
      const membership = memberships.find((m) => m.companyId === companyId);
      setDraft((prev) => ({
        ...prev,
        companyId,
        role: membership?.role ?? prev.role,
      }));
    },
    [memberships]
  );

  const handleSave = useCallback(async () => {
    if (!user || saving) return;
    setSaving(true);
    try {
      await saveStaffAccountProfile(user, draft, {
        previousCompanyId: fields.companyId,
        setActiveCompanyId: workspace?.setActiveCompanyId ?? (() => {}),
        refreshClaimsSilent: workspace?.refreshClaimsSilent ?? (async () => false),
      });
      setEditing(false);
      toast.success(String(t("staff_account.save_success")));
    } catch (error) {
      const message =
        error instanceof Error ? error.message.trim() : String(t("staff_account.save_failed"));
      toast.error(message || String(t("staff_account.save_failed")));
    } finally {
      setSaving(false);
    }
  }, [user, saving, draft, fields.companyId, workspace, t]);

  const handleDeleteAccount = useCallback(async () => {
    if (!user || deleting) return;
    const confirmed = window.confirm(String(t("staff_account.delete_account_confirm")));
    if (!confirmed) return;

    setDeleting(true);
    try {
      await deleteStaffAccount(user);
      toast.success(String(t("staff_account.delete_account_success")));
    } catch {
      toast.error(String(t("staff_account.delete_account_failed")));
    } finally {
      setDeleting(false);
    }
  }, [user, deleting, t]);

  const handleSignOut = useCallback(async () => {
    if (!auth || signingOut) return;
    setSigningOut(true);
    try {
      await signOut(auth);
    } finally {
      setSigningOut(false);
    }
  }, [signingOut]);

  return {
    fields,
    draft,
    memberships,
    editing,
    ready: Boolean(user),
    signingOut,
    saving,
    deleting,
    startEditing,
    cancelEditing,
    updateDraft,
    handleCompanyChange,
    handleSave,
    handleDeleteAccount,
    handleSignOut,
  };
}
