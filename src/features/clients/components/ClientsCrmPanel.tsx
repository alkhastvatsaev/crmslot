"use client";

import { Search, Upload, Plus } from "lucide-react";
import { downloadClientsCsv } from "@/features/clients/exportClientsCsv";
import ClientsCrmClientsList from "@/features/clients/components/ClientsCrmClientsList";
import ClientsCrmClientDetail from "@/features/clients/components/ClientsCrmClientDetail";
import { useClientsCrmPanelController } from "@/features/clients/hooks/useClientsCrmPanelController";

export default function ClientsCrmPanel() {
  const c = useClientsCrmPanelController();

  if (!c.crmEnabled) {
    return (
      <p
        data-testid="crm-disabled-hint"
        className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500"
      >
        {c.t("crm.disabled_hint")}
      </p>
    );
  }

  return (
    <div
      data-testid="clients-crm-panel"
      className="space-y-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
    >
      <div>
        <h2 className="text-lg font-bold text-slate-900">{c.t("crm.title")}</h2>
        <p className="text-sm text-slate-500">{c.t("crm.subtitle")}</p>
        {c.offline ? (
          <p data-testid="crm-offline-hint" className="mt-1 text-xs text-amber-700">
            {c.t("crm.offline_hint")}
          </p>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <input
          ref={c.importInputRef}
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          data-testid="crm-import-input"
          onChange={(e) => void c.handleImportCsv(e)}
        />
        <button
          type="button"
          data-testid="crm-import-btn"
          disabled={c.busy}
          onClick={() => c.importInputRef.current?.click()}
          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        >
          <Upload className="h-3.5 w-3.5" />
          {c.t("crm.import_csv")}
        </button>
        {c.pwaV2 ? (
          <button
            type="button"
            data-testid="crm-export-btn"
            disabled={c.busy || c.clients.length === 0}
            onClick={() => downloadClientsCsv(c.clients)}
            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            {c.t("crm.export_csv")}
          </button>
        ) : null}
      </div>

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          data-testid="crm-client-search"
          value={c.query}
          onChange={(e) => c.setQuery(e.target.value)}
          placeholder={String(c.t("crm.search_placeholder"))}
          className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ClientsCrmClientsList
          loading={c.loading}
          filtered={c.filtered}
          selectedId={c.selectedId}
          onSelect={c.setSelectedId}
          t={c.t}
        />

        <section className="space-y-4">
          <form
            onSubmit={(e) => void c.handleCreateClient(e)}
            data-testid="crm-create-client-form"
            className="rounded-lg border border-slate-100 bg-slate-50 p-3"
          >
            <p className="mb-2 text-xs font-bold uppercase text-slate-500">
              {c.t("crm.new_client")}
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              <input
                data-testid="crm-client-firstname"
                value={c.firstName}
                onChange={(e) => c.setFirstName(e.target.value)}
                placeholder={String(c.t("crm.first_name"))}
                className="rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
              />
              <input
                data-testid="crm-client-lastname"
                value={c.lastName}
                onChange={(e) => c.setLastName(e.target.value)}
                placeholder={String(c.t("crm.last_name"))}
                className="rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
              />
              <input
                data-testid="crm-client-phone"
                value={c.phone}
                onChange={(e) => c.setPhone(e.target.value)}
                placeholder={String(c.t("crm.phone"))}
                className="rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
              />
              <input
                data-testid="crm-client-email"
                value={c.email}
                onChange={(e) => c.setEmail(e.target.value)}
                placeholder={String(c.t("crm.email"))}
                className="rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
              />
            </div>
            <button
              type="submit"
              disabled={c.busy}
              data-testid="crm-create-client-submit"
              className="mt-2 flex w-full items-center justify-center gap-1 rounded-lg bg-blue-600 py-2 text-sm font-bold text-white disabled:opacity-50"
            >
              <Plus className="h-4 w-4" />
              {c.t("crm.add_client")}
            </button>
          </form>

          {c.selected ? (
            <ClientsCrmClientDetail
              selected={c.selected}
              companyId={c.companyId}
              sites={c.sites}
              sitesLoading={c.sitesLoading}
              busy={c.busy}
              pwaV2={c.pwaV2}
              equipmentEnabled={c.equipmentEnabled}
              maintenanceEnabled={c.maintenanceEnabled}
              pager={c.pager}
              editFirstName={c.editFirstName}
              setEditFirstName={c.setEditFirstName}
              editLastName={c.editLastName}
              setEditLastName={c.setEditLastName}
              editPhone={c.editPhone}
              setEditPhone={c.setEditPhone}
              editEmail={c.editEmail}
              setEditEmail={c.setEditEmail}
              siteLabel={c.siteLabel}
              setSiteLabel={c.setSiteLabel}
              siteAddress={c.siteAddress}
              setSiteAddress={c.setSiteAddress}
              onSaveClient={c.handleSaveClient}
              onDeleteClient={() => void c.handleDeleteClient()}
              onCreateSite={c.handleCreateSite}
              t={c.t}
            />
          ) : null}
        </section>
      </div>
    </div>
  );
}
