"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { MapPin, Plus, Search, Trash2, Upload, User } from "lucide-react";
import { toast } from "sonner";
import { firestore } from "@/core/config/firebase";
import { useCompanyWorkspaceOptional } from "@/context/CompanyWorkspaceContext";
import { useTranslation } from "@/core/i18n/I18nContext";
import { useFeatureFlag } from "@/core/useFeatureFlags";
import { useClients } from "@/features/clients/useClients";
import { useClientSites } from "@/features/clients/useClientSites";
import { buildClientDisplayName } from "@/features/clients/clientDisplayName";
import { parseClientsCsv } from "@/features/clients/parseClientsCsv";
import { clearClientsOfflineCache } from "@/features/clients/clientCrmOfflineCache";
import {
  bulkCreateClients,
  createClient,
  createSite,
  deleteClientWithSites,
  updateClient,
} from "@/features/clients/clientFirestore";
import ClientInterventionsPanel from "@/features/clients/components/ClientInterventionsPanel";
import EquipmentPanel from "@/features/equipment/components/EquipmentPanel";
import MaintenanceContractPanel from "@/features/maintenance/components/MaintenanceContractPanel";
import { downloadClientsCsv } from "@/features/clients/exportClientsCsv";
import {
  navigateCompanyHub,
  COMPANY_HUB_ANCHOR_SMART_FORM,
} from "@/features/company/companyHubNavigation";
import { useDashboardPagerOptional } from "@/features/dashboard/dashboardPagerContext";

export default function ClientsCrmPanel() {
  const { t } = useTranslation();
  const crmEnabled = useFeatureFlag("crmContacts");
  const pwaV2 = useFeatureFlag("pwaV2Bundle");
  const equipmentEnabled = useFeatureFlag("equipmentInventory");
  const maintenanceEnabled = useFeatureFlag("maintenanceContracts");
  const workspace = useCompanyWorkspaceOptional();
  const companyId = workspace?.activeCompanyId?.trim() ?? "";
  const pager = useDashboardPagerOptional();
  const { clients, loading, offline } = useClients();
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = clients.find((c) => c.id === selectedId) ?? null;
  const { sites, loading: sitesLoading } = useClientSites(companyId, selectedId);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [siteLabel, setSiteLabel] = useState("");
  const [siteAddress, setSiteAddress] = useState("");
  const [busy, setBusy] = useState(false);
  const [editFirstName, setEditFirstName] = useState("");
  const [editLastName, setEditLastName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editCompanyName, setEditCompanyName] = useState("");
  const importInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!selected) return;
    setEditFirstName(selected.firstName ?? "");
    setEditLastName(selected.lastName ?? "");
    setEditPhone(selected.phone ?? "");
    setEditEmail(selected.email ?? "");
    setEditCompanyName(selected.companyName ?? "");
  }, [selected]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return clients;
    return clients.filter((c) => {
      const hay = [c.displayName, c.firstName, c.lastName, c.companyName, c.phone, c.email]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [clients, query]);

  if (!crmEnabled) {
    return (
      <p
        data-testid="crm-disabled-hint"
        className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500"
      >
        {t("crm.disabled_hint")}
      </p>
    );
  }

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firestore || !companyId) return;
    const displayName = buildClientDisplayName({
      displayName: "",
      firstName,
      lastName,
      companyName,
    });
    if (!displayName) {
      toast.error(String(t("crm.client_name_required")));
      return;
    }
    setBusy(true);
    try {
      const id = await createClient(firestore, {
        companyId,
        displayName,
        firstName: firstName.trim() || null,
        lastName: lastName.trim() || null,
        companyName: companyName.trim() || null,
        phone: phone.trim() || null,
        email: email.trim() || null,
      });
      setFirstName("");
      setLastName("");
      setPhone("");
      setEmail("");
      setCompanyName("");
      setSelectedId(id);
      toast.success(String(t("crm.client_created")));
    } catch {
      toast.error(String(t("common.error")));
    } finally {
      setBusy(false);
    }
  };

  const handleDeleteClient = async () => {
    if (!firestore || !companyId || !selected) return;
    const name = buildClientDisplayName(selected) || selected.id;
    if (!window.confirm(t("crm.delete_client_confirm").replace("{{name}}", name))) return;
    setBusy(true);
    try {
      await deleteClientWithSites(firestore, companyId, selected.id);
      clearClientsOfflineCache(companyId);
      setSelectedId(null);
      toast.success(String(t("crm.client_deleted")));
    } catch {
      toast.error(String(t("common.error")));
    } finally {
      setBusy(false);
    }
  };

  const handleSaveClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firestore || !selected) return;
    const displayName = buildClientDisplayName({
      displayName: "",
      firstName: editFirstName,
      lastName: editLastName,
      companyName: editCompanyName,
    });
    if (!displayName) {
      toast.error(String(t("crm.client_name_required")));
      return;
    }
    setBusy(true);
    try {
      await updateClient(firestore, selected.id, {
        displayName,
        firstName: editFirstName.trim() || null,
        lastName: editLastName.trim() || null,
        companyName: editCompanyName.trim() || null,
        phone: editPhone.trim() || null,
        email: editEmail.trim() || null,
      });
      toast.success(String(t("crm.client_updated")));
    } catch {
      toast.error(String(t("common.error")));
    } finally {
      setBusy(false);
    }
  };

  const handleImportCsv = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !firestore || !companyId) return;
    setBusy(true);
    try {
      const text = await file.text();
      const rows = parseClientsCsv(text);
      if (rows.length === 0) {
        toast.error(String(t("crm.import_empty")));
        return;
      }
      const n = await bulkCreateClients(
        firestore,
        companyId,
        rows.map((r) => ({
          displayName: r.displayName,
          firstName: r.firstName ?? null,
          lastName: r.lastName ?? null,
          companyName: r.companyName ?? null,
          phone: r.phone ?? null,
          email: r.email ?? null,
        }))
      );
      toast.success(String(t("crm.import_success")).replace("{{count}}", String(n)));
    } catch {
      toast.error(String(t("common.error")));
    } finally {
      setBusy(false);
    }
  };

  const handleCreateSite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firestore || !companyId || !selected) return;
    if (!siteAddress.trim()) {
      toast.error(String(t("crm.site_address_required")));
      return;
    }
    setBusy(true);
    try {
      await createSite(firestore, {
        companyId,
        clientId: selected.id,
        label: siteLabel.trim() || siteAddress.trim(),
        address: siteAddress.trim(),
      });
      setSiteLabel("");
      setSiteAddress("");
      toast.success(String(t("crm.site_created")));
    } catch {
      toast.error(String(t("common.error")));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      data-testid="clients-crm-panel"
      className="space-y-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
    >
      <div>
        <h2 className="text-lg font-bold text-slate-900">{t("crm.title")}</h2>
        <p className="text-sm text-slate-500">{t("crm.subtitle")}</p>
        {offline ? (
          <p data-testid="crm-offline-hint" className="mt-1 text-xs text-amber-700">
            {t("crm.offline_hint")}
          </p>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <input
          ref={importInputRef}
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          data-testid="crm-import-input"
          onChange={(e) => void handleImportCsv(e)}
        />
        <button
          type="button"
          data-testid="crm-import-btn"
          disabled={busy}
          onClick={() => importInputRef.current?.click()}
          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        >
          <Upload className="h-3.5 w-3.5" />
          {t("crm.import_csv")}
        </button>
        {pwaV2 ? (
          <button
            type="button"
            data-testid="crm-export-btn"
            disabled={busy || clients.length === 0}
            onClick={() => downloadClientsCsv(clients)}
            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            {t("crm.export_csv")}
          </button>
        ) : null}
      </div>

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          data-testid="crm-client-search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={String(t("crm.search_placeholder"))}
          className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="min-h-[200px] rounded-lg border border-slate-100">
          <p className="border-b border-slate-100 px-3 py-2 text-xs font-bold uppercase tracking-wide text-slate-400">
            {t("crm.clients_list")}
          </p>
          <ul className="max-h-64 overflow-y-auto p-2" data-testid="crm-clients-list">
            {loading ? (
              <li className="px-2 py-4 text-center text-sm text-slate-400">
                {t("common.loading")}
              </li>
            ) : filtered.length === 0 ? (
              <li className="px-2 py-4 text-center text-sm text-slate-500">
                {t("crm.clients_empty")}
              </li>
            ) : (
              filtered.map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    data-testid={`crm-client-row-${c.id}`}
                    onClick={() => setSelectedId(c.id)}
                    className={`flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm transition ${
                      selectedId === c.id ? "bg-slate-900 text-white" : "hover:bg-slate-50"
                    }`}
                  >
                    <User className="h-4 w-4 shrink-0" />
                    <span className="truncate font-semibold">
                      {buildClientDisplayName(c) || c.id}
                    </span>
                  </button>
                </li>
              ))
            )}
          </ul>
        </section>

        <section className="space-y-4">
          <form
            onSubmit={(e) => void handleCreateClient(e)}
            data-testid="crm-create-client-form"
            className="rounded-lg border border-slate-100 bg-slate-50 p-3"
          >
            <p className="mb-2 text-xs font-bold uppercase text-slate-500">{t("crm.new_client")}</p>
            <div className="grid gap-2 sm:grid-cols-2">
              <input
                data-testid="crm-client-firstname"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder={String(t("crm.first_name"))}
                className="rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
              />
              <input
                data-testid="crm-client-lastname"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder={String(t("crm.last_name"))}
                className="rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
              />
              <input
                data-testid="crm-client-phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder={String(t("crm.phone"))}
                className="rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
              />
              <input
                data-testid="crm-client-email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={String(t("crm.email"))}
                className="rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
              />
            </div>
            <button
              type="submit"
              disabled={busy}
              data-testid="crm-create-client-submit"
              className="mt-2 flex w-full items-center justify-center gap-1 rounded-lg bg-blue-600 py-2 text-sm font-bold text-white disabled:opacity-50"
            >
              <Plus className="h-4 w-4" />
              {t("crm.add_client")}
            </button>
          </form>

          {selected ? (
            <div data-testid="crm-client-detail" className="rounded-lg border border-slate-100 p-3">
              <form
                onSubmit={(e) => void handleSaveClient(e)}
                data-testid="crm-edit-client-form"
                className="mb-3 space-y-2 border-b border-slate-100 pb-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-bold uppercase text-slate-400">
                    {t("crm.edit_client")}
                  </p>
                  <button
                    type="button"
                    data-testid="crm-delete-client-btn"
                    disabled={busy}
                    onClick={() => void handleDeleteClient()}
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
              <p className="mt-3 text-xs font-bold uppercase text-slate-400">
                {t("crm.sites_title")}
              </p>
              {sitesLoading ? (
                <p className="text-sm text-slate-400">{t("common.loading")}</p>
              ) : sites.length === 0 ? (
                <p className="text-sm text-slate-500">{t("crm.sites_empty")}</p>
              ) : (
                <ul className="mt-1 space-y-1" data-testid="crm-sites-list">
                  {sites.map((s) => (
                    <li
                      key={s.id}
                      className="flex gap-2 rounded-md bg-slate-50 px-2 py-1.5 text-sm"
                    >
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
                onSubmit={(e) => void handleCreateSite(e)}
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
                        "belgmap_prefill_client",
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
          ) : null}
        </section>
      </div>
    </div>
  );
}
