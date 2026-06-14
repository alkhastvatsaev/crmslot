"use client";

import { useEffect, useState } from "react";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { Building2 } from "lucide-react";
import { toast } from "sonner";
import { firestore } from "@/core/config/firebase";
import { useCompanyWorkspaceOptional } from "@/context/CompanyWorkspaceContext";
import { useTranslation } from "@/core/i18n/I18nContext";
import { useFeatureFlag } from "@/core/useFeatureFlags";

type BillingFields = {
  vatNumber: string;
  iban: string;
  addressStreet: string;
  addressCity: string;
  addressZip: string;
  adminEmail: string;
};

const EMPTY: BillingFields = {
  vatNumber: "",
  iban: "",
  addressStreet: "",
  addressCity: "",
  addressZip: "",
  adminEmail: "",
};

export default function CompanyBillingSettingsPanel() {
  const { t } = useTranslation();
  const peppolEnabled = useFeatureFlag("peppolEInvoicing");
  const workspace = useCompanyWorkspaceOptional();
  const companyId = workspace?.activeCompanyId?.trim() ?? "";
  const isAdmin = workspace?.activeRole === "admin";

  const [fields, setFields] = useState<BillingFields>(EMPTY);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!firestore || !companyId) return;
    void getDoc(doc(firestore, "companies", companyId)).then((snap) => {
      if (!snap.exists()) return;
      const d = snap.data() as Record<string, unknown>;
      setFields({
        vatNumber: String(d.vatNumber ?? d.billingVatNumber ?? ""),
        iban: String(d.iban ?? d.billingIban ?? ""),
        addressStreet: String(d.addressStreet ?? d.street ?? ""),
        addressCity: String(d.addressCity ?? d.city ?? ""),
        addressZip: String(d.addressZip ?? d.postalCode ?? ""),
        adminEmail: String(d.adminEmail ?? ""),
      });
    });
  }, [companyId]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firestore || !companyId || !isAdmin) return;
    setSaving(true);
    try {
      await updateDoc(doc(firestore, "companies", companyId), {
        vatNumber: fields.vatNumber.trim() || null,
        billingVatNumber: fields.vatNumber.trim() || null,
        iban: fields.iban.trim() || null,
        billingIban: fields.iban.trim() || null,
        addressStreet: fields.addressStreet.trim() || null,
        addressCity: fields.addressCity.trim() || null,
        addressZip: fields.addressZip.trim() || null,
        adminEmail: fields.adminEmail.trim() || null,
        countryCode: "BE",
      });
      toast.success(String(t("company.billing_settings_saved")));
    } catch {
      toast.error(String(t("common.error")));
    } finally {
      setSaving(false);
    }
  };

  if (!peppolEnabled || !companyId) return null;

  return (
    <section
      data-testid="company-billing-settings-panel"
      className="space-y-3 rounded-xl border border-slate-200 bg-white p-4"
    >
      <div className="flex items-center gap-2">
        <Building2 className="h-4 w-4 text-slate-500" />
        <h3 className="text-sm font-bold text-slate-900">{t("company.billing_settings_title")}</h3>
      </div>
      <form onSubmit={(e) => void handleSave(e)} className="grid gap-2 sm:grid-cols-2">
        <input
          data-testid="billing-vat"
          value={fields.vatNumber}
          onChange={(e) => setFields((f) => ({ ...f, vatNumber: e.target.value }))}
          placeholder={String(t("company.billing_vat"))}
          disabled={!isAdmin}
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm sm:col-span-2"
        />
        <input
          data-testid="billing-iban"
          value={fields.iban}
          onChange={(e) => setFields((f) => ({ ...f, iban: e.target.value }))}
          placeholder={String(t("company.billing_iban"))}
          disabled={!isAdmin}
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm sm:col-span-2"
        />
        <input
          value={fields.addressStreet}
          onChange={(e) => setFields((f) => ({ ...f, addressStreet: e.target.value }))}
          placeholder={String(t("company.billing_street"))}
          disabled={!isAdmin}
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm sm:col-span-2"
        />
        <input
          value={fields.addressZip}
          onChange={(e) => setFields((f) => ({ ...f, addressZip: e.target.value }))}
          placeholder={String(t("company.billing_zip"))}
          disabled={!isAdmin}
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
        />
        <input
          value={fields.addressCity}
          onChange={(e) => setFields((f) => ({ ...f, addressCity: e.target.value }))}
          placeholder={String(t("company.billing_city"))}
          disabled={!isAdmin}
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
        />
        <input
          data-testid="billing-admin-email"
          value={fields.adminEmail}
          onChange={(e) => setFields((f) => ({ ...f, adminEmail: e.target.value }))}
          placeholder={String(t("company.billing_admin_email"))}
          disabled={!isAdmin}
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm sm:col-span-2"
        />
        {isAdmin ? (
          <button
            type="submit"
            disabled={saving}
            data-testid="billing-settings-save"
            className="rounded-lg bg-slate-900 py-2 text-sm font-bold text-white disabled:opacity-50 sm:col-span-2"
          >
            {t("company.billing_settings_save")}
          </button>
        ) : null}
      </form>
    </section>
  );
}
