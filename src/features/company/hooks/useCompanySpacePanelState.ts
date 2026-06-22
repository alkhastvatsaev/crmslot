"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  where,
} from "firebase/firestore";
import { toast } from "sonner";
import { auth, firestore } from "@/core/config/firebase";
import { logger } from "@/core/logger";
import { useCompanyWorkspace } from "@/context/CompanyWorkspaceContext";
import { useTranslation } from "@/core/i18n/I18nContext";

export function useCompanySpacePanelState() {
  const { t } = useTranslation();
  const {
    firebaseUid,
    memberships,
    activeCompanyId,
    setActiveCompanyId,
    activeRole,
    refreshClaimsSilent,
  } = useCompanyWorkspace();

  const [companyName, setCompanyName] = useState("");
  const [invitePhone, setInvitePhone] = useState("");
  const [inviteDocId, setInviteDocId] = useState("");
  const [busy, setBusy] = useState(false);
  const [claimsPreview, setClaimsPreview] = useState<string | null>(null);
  const [invitesCount, setInvitesCount] = useState(0);

  const isAdmin = activeRole === "admin";

  useEffect(() => {
    if (!firestore || !firebaseUid || !activeCompanyId || !isAdmin) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setInvitesCount(0);
      return () => {};
    }

    let unsub: (() => void) | undefined;
    const timeout = setTimeout(() => {
      const q = query(
        collection(firestore!, "company_invites"),
        where("invitedByUid", "==", firebaseUid)
      );
      unsub = onSnapshot(
        q,
        (snap) => {
          const n = snap.docs.filter(
            (d) => (d.data() as { companyId?: string }).companyId === activeCompanyId
          ).length;
          setInvitesCount(n);
        },
        () => setInvitesCount(0)
      );
    }, 10);

    return () => {
      clearTimeout(timeout);
      unsub?.();
    };
  }, [firebaseUid, activeCompanyId, isAdmin]);

  const createCompany = async () => {
    const name = companyName.trim();
    if (!firestore || !auth?.currentUser || !name) {
      toast.error(t("company.toast.name_required"));
      return;
    }
    setBusy(true);
    try {
      const user = auth.currentUser;
      const cref = await addDoc(collection(firestore, "companies"), {
        name,
        createdAt: serverTimestamp(),
        createdByUid: user.uid,
      });
      await setDoc(doc(firestore, "users", user.uid, "company_memberships", cref.id), {
        role: "admin",
        joinedAt: serverTimestamp(),
        companyName: name,
      });
      setCompanyName("");
      await refreshClaimsSilent();
      toast.success(t("company.toast.company_created"));
    } catch (e) {
      logger.error("createCompany", { error: e instanceof Error ? e.message : String(e) });
      toast.error(t("company.toast.create_failed"), {
        description: e instanceof Error ? e.message : String(e),
      });
    } finally {
      setBusy(false);
    }
  };

  const submitInvite = async () => {
    const phone = invitePhone.trim();
    if (!firestore || !auth?.currentUser || !activeCompanyId || !phone) {
      toast.error(t("company.toast.missing_company_or_contact"));
      return;
    }
    if (!isAdmin) return;

    setBusy(true);
    try {
      await addDoc(collection(firestore, "company_invites"), {
        companyId: activeCompanyId,
        phone,
        role: "collaborateur",
        createdAt: serverTimestamp(),
        invitedByUid: auth.currentUser.uid,
      });
      setInvitePhone("");
      toast.success(t("company.toast.invite_saved"));
    } catch (e) {
      logger.error("submitInvite", { error: e instanceof Error ? e.message : String(e) });
      toast.error(t("company.toast.invite_failed"), {
        description: e instanceof Error ? e.message : String(e),
      });
    } finally {
      setBusy(false);
    }
  };

  const acceptInvite = async () => {
    const id = inviteDocId.trim();
    if (!auth?.currentUser || !id) {
      toast.error(t("company.toast.invite_id_missing"));
      return;
    }
    setBusy(true);
    try {
      const idToken = await auth.currentUser.getIdToken(true);
      const res = await fetch("/api/company/accept-invite", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ inviteId: id }),
      });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) throw new Error(data.error || res.statusText);
      setInviteDocId("");
      await refreshClaimsSilent();
      toast.success(t("company.toast.invite_accepted"));
    } catch (e) {
      logger.error("acceptInvite", { error: e instanceof Error ? e.message : String(e) });
      toast.error(t("company.toast.accept_failed"), {
        description: e instanceof Error ? e.message : String(e),
      });
    } finally {
      setBusy(false);
    }
  };

  const syncClaims = useCallback(async () => {
    if (!auth?.currentUser) {
      toast.error(t("company.toast.login_required"));
      return;
    }
    setBusy(true);
    try {
      const idToken = await auth.currentUser.getIdToken(true);
      const res = await fetch("/api/company/sync-claims", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${idToken}` },
        body: JSON.stringify({ activeCompanyId }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        claims?: { bmTenants?: string[]; bmActive?: string | null };
        error?: string;
      };
      if (!res.ok || !data.ok) throw new Error(data.error || res.statusText);
      setClaimsPreview(JSON.stringify(data.claims ?? {}, null, 2));
      await auth.currentUser.getIdToken(true);
      toast.success(t("company.toast.token_updated"));
    } catch (e) {
      logger.error("syncClaims", { error: e instanceof Error ? e.message : String(e) });
      toast.error(t("company.toast.sync_failed"), {
        description: e instanceof Error ? e.message : String(e),
      });
    } finally {
      setBusy(false);
    }
  }, [activeCompanyId, t]);

  const activeCompanyLabel = useMemo(() => {
    return memberships.find((m) => m.companyId === activeCompanyId)?.companyName ?? "";
  }, [memberships, activeCompanyId]);

  return {
    firebaseUid,
    memberships,
    activeCompanyId,
    setActiveCompanyId,
    isAdmin,
    companyName,
    setCompanyName,
    invitePhone,
    setInvitePhone,
    inviteDocId,
    setInviteDocId,
    busy,
    claimsPreview,
    invitesCount,
    activeCompanyLabel,
    createCompany,
    submitInvite,
    acceptInvite,
    syncClaims,
  };
}
