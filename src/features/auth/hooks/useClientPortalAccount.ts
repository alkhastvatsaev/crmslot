"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { onAuthStateChanged, signOut, type User } from "firebase/auth";
import { toast } from "sonner";
import { clientPortalAuth } from "@/core/config/firebase";
import { useTranslation } from "@/core/i18n/I18nContext";
import {
  emptyClientPortalAccountFields,
  loadClientPortalAccountFields,
  mergeRequesterProfileFromAccount,
  resolveClientPortalAccountFields,
  saveClientPortalAccountFields,
  type ClientPortalAccountFields,
} from "@/features/auth/clientPortalAccountProfile";
import { useRequesterHub } from "@/features/interventions/context/RequesterHubContext";

export function isVerifiedClientPortalUser(user: User | null): user is User {
  return Boolean(user && !user.isAnonymous && user.emailVerified);
}

export function useClientPortalAccount() {
  const { t } = useTranslation();
  const { setProfile, setClientAccountFields } = useRequesterHub();
  const [authUser, setAuthUser] = useState<User | null>(clientPortalAuth?.currentUser ?? null);
  const [fields, setFields] = useState<ClientPortalAccountFields>(emptyClientPortalAccountFields());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const loadedUidRef = useRef<string | null>(null);
  const fieldsRef = useRef(fields);
  fieldsRef.current = fields;

  const isAuthenticated = isVerifiedClientPortalUser(authUser);

  const syncFields = useCallback(
    (next: ClientPortalAccountFields) => {
      fieldsRef.current = next;
      setFields(next);
      setClientAccountFields(next);
      setProfile((prev) => mergeRequesterProfileFromAccount(prev, next));
    },
    [setClientAccountFields, setProfile]
  );

  useEffect(() => {
    if (!clientPortalAuth) {
      setAuthUser(null);
      setLoading(false);
      return;
    }
    return onAuthStateChanged(clientPortalAuth, (user) => setAuthUser(user));
  }, []);

  useEffect(() => {
    if (!isAuthenticated || !authUser) {
      loadedUidRef.current = null;
      const empty = emptyClientPortalAccountFields();
      fieldsRef.current = empty;
      setFields(empty);
      setClientAccountFields(null);
      setLoading(false);
      return;
    }

    if (loadedUidRef.current === authUser.uid) return;

    let cancelled = false;
    void (async () => {
      setLoading(true);
      try {
        const loaded = await loadClientPortalAccountFields(authUser.uid, authUser.email);
        const resolved = resolveClientPortalAccountFields(loaded, authUser.email);
        if (cancelled) return;
        loadedUidRef.current = authUser.uid;
        syncFields(resolved);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [authUser?.uid, isAuthenticated, authUser, syncFields, setClientAccountFields]);

  const updateField = useCallback(
    (key: keyof ClientPortalAccountFields, value: string) => {
      setFields((prev) => {
        const next = { ...prev, [key]: value };
        fieldsRef.current = next;
        setClientAccountFields(next);
        setProfile((p) => mergeRequesterProfileFromAccount(p, next));
        return next;
      });
    },
    [setClientAccountFields, setProfile]
  );

  const persistAccount = useCallback(async () => {
    if (!authUser || !isAuthenticated) return;
    setSaving(true);
    try {
      await saveClientPortalAccountFields(authUser.uid, fieldsRef.current);
      toast.success(String(t("requester.account.save_success")));
    } catch {
      toast.error(String(t("requester.account.save_failed")));
    } finally {
      setSaving(false);
    }
  }, [authUser, isAuthenticated, t]);

  const handleSignOut = useCallback(async () => {
    if (!clientPortalAuth) return;
    await signOut(clientPortalAuth);
    loadedUidRef.current = null;
    const empty = emptyClientPortalAccountFields();
    fieldsRef.current = empty;
    setFields(empty);
    setClientAccountFields(null);
  }, [setClientAccountFields]);

  return {
    isAuthenticated,
    authUser,
    fields,
    updateField,
    persistAccount,
    handleSignOut,
    loading,
    saving,
  };
}
