"use client";

import { useEffect, useState } from "react";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { firestore } from "@/core/config/firebase";
import {
  DEFAULT_BILLING_SURCHARGE_SETTINGS,
  normalizeBillingSurchargeSettings,
  type BillingSurchargeSettings,
} from "@/features/billing/billingSurchargeSettings";

export function useBillingSurchargeSettings(companyId: string | null) {
  const [settings, setSettings] = useState<BillingSurchargeSettings>(
    DEFAULT_BILLING_SURCHARGE_SETTINGS
  );
  const [loading, setLoading] = useState(Boolean(companyId));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!firestore || !companyId) {
      setSettings(DEFAULT_BILLING_SURCHARGE_SETTINGS);
      setLoading(false);
      return;
    }

    setLoading(true);
    void getDoc(doc(firestore, "companies", companyId)).then((snap) => {
      if (!snap.exists()) {
        setSettings(DEFAULT_BILLING_SURCHARGE_SETTINGS);
        setLoading(false);
        return;
      }
      const raw = snap.data()?.billingSurchargeSettings;
      setSettings(normalizeBillingSurchargeSettings(raw));
      setLoading(false);
    });
  }, [companyId]);

  const save = async (next: BillingSurchargeSettings) => {
    if (!firestore || !companyId) return;
    setSaving(true);
    try {
      const normalized = normalizeBillingSurchargeSettings(next);
      await updateDoc(doc(firestore, "companies", companyId), {
        billingSurchargeSettings: normalized,
      });
      setSettings(normalized);
    } finally {
      setSaving(false);
    }
  };

  return { settings, setSettings, loading, saving, save };
}
