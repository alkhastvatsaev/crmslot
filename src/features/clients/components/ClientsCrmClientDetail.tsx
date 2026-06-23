"use client";

import { MapPin, Trash2 } from "lucide-react";
import { buildClientDisplayName } from "@/features/clients/clientDisplayName";
import type { ClientRecord, SiteRecord } from "@/features/clients/types";
import ClientInterventionsPanel from "@/features/clients/components/ClientInterventionsPanel";
import EquipmentPanel from "@/features/equipment/components/EquipmentPanel";
import MaintenanceContractPanel from "@/features/maintenance/components/MaintenanceContractPanel";
import {
  navigateCompanyHub,
  COMPANY_HUB_ANCHOR_SMART_FORM,
} from "@/features/company/companyHubNavigation";
import type { DashboardPagerApi } from "@/features/dashboard/dashboardPagerContext";

export default function ClientsCrmClientDetail({
  selected,
  companyId,
  sites,
  sitesLoading,
  busy,
  pwaV2,
  equipmentEnabled,
  maintenanceEnabled,
  pager,
  editFirstName,
  setEditFirstName,
  editLastName,
  setEditLastName,
  editPhone,
  setEditPhone,
  editEmail,
  setEditEmail,
  siteLabel,
  setSiteLabel,
  siteAddress,
  setSiteAddress,
  onSaveClient,
  onDeleteClient,
  onCreateSite,
  t,
}: {
  selected: ClientRecord;
  companyId: string;
  sites: SiteRecord[];
  sitesLoading: boolean;
  busy: boolean;
  pwaV2: boolean;
  equipmentEnabled: boolean;
  maintenanceEnabled: boolean;
  pager: DashboardPagerApi | null;
  editFirstName: string;
  setEditFirstName: (v: string) => void;
  editLastName: string;
  setEditLastName: (v: string) => void;
  editPhone: string;
  setEditPhone: (v: string) => void;
  editEmail: string;
  setEditEmail: (v: string) => void;
  siteLabel: string;
  setSiteLabel: (v: string) => void;
  siteAddress: string;
  setSiteAddress: (v: string) => void;
  onSaveClient: (e: React.FormEvent) => void;
  onDeleteClient: () => void;
  onCreateSite: (e: React.FormEvent) => void;
  t: (key: string) => string;
}) {
  return (
    <div data-testid="crm-client-detail" className="rounded-lg border border-slate-100 p-3">
      <form
        onSubmit={(e) => void onSaveClient(e)}
        data-testid="crm-edit-client-form"
        className="mb-3 space-y-2 border-b border-slate-100 pb-3"
      >
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-bold uppercase text-slate-400">{t("crm.edit_client")}</p>
          <button
            type="button"
            data-testid="crm-delete-client-btn"
            disabled={busy}
            onClick={() => void onDeleteClient()}
            className="flex items-center gap-1 rounded-lg border border-red-200 px-2 py-1 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"
          >
            <Trash2 className="h-3.5 w-3.5" />
            {t("crm.delete_client")}
          </button>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          <input
            data-testid="crm-edit-firstname"
            value={editFirstName}
            onChange={(e) => setEditFirstName(e.target.value)}
            placeholder={String(t("crm.first_name"))}
            className="rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
          />
          <input
            data-testid="crm-edit-lastname"
            value={editLastName}
            onChange={(e) => setEditLastName(e.target.value)}
            placeholder={String(t("crm.last_name"))}
            className="rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
          />
          <input
            data-testid="crm-edit-phone"
            value={editPhone}
            onChange={(e) => setEditPhone(e.target.value)}
            placeholder={String(t("crm.phone"))}
            className="rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
          />
          <input
            data-testid="crm-edit-email"
            value={editEmail}
            onChange={(e) => setEditEmail(e.target.value)}
            placeholder={String(t("crm.email"))}
            className="rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
          />
        </div>
        <button
          type="submit"
          disabled={busy}
          data-testid="crm-edit-submit"
          className="w-full rounded-lg bg-slate-800 py-2 text-sm font-bold text-white disabled:opacity-50"
        >
          {t("crm.save_client")}
        </button>
      </form>

      <p className="mt-3 text-xs font-bold uppercase text-slate-400">{t("crm.sites_title")}</p>
      {sitesLoading ? (
        <p className="text-sm text-slate-400">{t("common.loading")}</p>
      ) : sites.length === 0 ? (
        <p className="text-sm text-slate-500">{t("crm.sites_empty")}</p>
      ) : (
        <ul className="mt-1 space-y-1" data-testid="crm-sites-list">
          {sites.map((s) => (
            <li key={s.id} className="flex gap-2 rounded-md bg-slate-50 px-2 py-1.5 text-sm">
              <MapPin className="h-4 w-4 shrink-0 text-emerald-600" />
              <span>
                <span className="font-semibold">{s.label}</span>
                <span className="block text-xs text-slate-500">{s.address}</span>
              </span>
            </li>
          ))}
        </ul>
      )}

      <form
        onSubmit={(e) => void onCreateSite(e)}
        className="mt-3 space-y-2"
        data-testid="crm-create-site-form"
      >
        <input
          value={siteLabel}
          onChange={(e) => setSiteLabel(e.target.value)}
          placeholder={String(t("crm.site_label"))}
          className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
        />
        <input
          data-testid="crm-site-address"
          value={siteAddress}
          onChange={(e) => setSiteAddress(e.target.value)}
          placeholder={String(t("crm.site_address"))}
          className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
          required
        />
        <button
          type="submit"
          disabled={busy}
          data-testid="crm-create-site-submit"
          className="w-full rounded-lg bg-emerald-600 py-2 text-sm font-bold text-white disabled:opacity-50"
        >
          {t("crm.add_site")}
        </button>
      </form>

      {pwaV2 ? (
        <button
          type="button"
          data-testid="crm-recurring-request-btn"
          className="mt-3 w-full rounded-lg border border-blue-200 bg-blue-50 py-2 text-sm font-bold text-blue-800"
          onClick={() => {
            if (typeof sessionStorage !== "undefined") {
              sessionStorage.setItem(
                "crmslot_prefill_client",
                JSON.stringify({
                  clientId: selected.id,
                  clientName: buildClientDisplayName(selected),
                  phone: selected.phone,
                  email: selected.email,
                })
              );
            }
            navigateCompanyHub(pager, COMPANY_HUB_ANCHOR_SMART_FORM);
          }}
        >
          {t("crm.recurring_request")}
        </button>
      ) : null}

      <ClientInterventionsPanel companyId={companyId} clientId={selected.id} />
      {equipmentEnabled ? (
        <div className="mt-4 border-t border-slate-100 pt-4">
          <EquipmentPanel clientId={selected.id} />
        </div>
      ) : null}
      {maintenanceEnabled ? (
        <div className="mt-4 border-t border-slate-100 pt-4">
          <MaintenanceContractPanel clientId={selected.id} />
        </div>
      ) : null}
    </div>
  );
}
