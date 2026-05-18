"use client";

import { useEffect, useState } from "react";
import { Plus, Wrench } from "lucide-react";
import { toast } from "sonner";
import { firestore } from "@/core/config/firebase";
import { useTranslation } from "@/core/i18n/I18nContext";
import { useCompanyWorkspaceOptional } from "@/context/CompanyWorkspaceContext";
import { useFeatureFlag } from "@/core/useFeatureFlags";
import {
  subscribeMaintenanceContracts,
  createMaintenanceContract,
  deactivateMaintenanceContract,
} from "../maintenanceFirestore";
import ContractCard from "./ContractCard";
import type { MaintenanceContract, MaintenanceFrequency } from "../types";
import { FREQUENCY_LABELS } from "../types";

const FREQUENCIES: MaintenanceFrequency[] = ["weekly", "monthly", "quarterly", "biannual", "yearly"];

export default function MaintenanceContractPanel({ clientId }: { clientId?: string }) {
  const { t } = useTranslation();
  const enabled = useFeatureFlag("maintenanceContracts");
  const workspace = useCompanyWorkspaceOptional();
  const companyId = workspace?.activeCompanyId?.trim() ?? "";
  const isAdmin = workspace?.activeRole === "admin";

  const [contracts, setContracts] = useState<MaintenanceContract[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [busy, setBusy] = useState(false);

  const [label, setLabel] = useState("");
  const [templateTitle, setTemplateTitle] = useState("");
  const [frequency, setFrequency] = useState<MaintenanceFrequency>("monthly");
  const [nextDueDate, setNextDueDate] = useState(new Date().toISOString().slice(0, 10));

  useEffect(() => {
    if (!enabled || !firestore || !companyId) return;
    return subscribeMaintenanceContracts(firestore, companyId, (all) => {
      setContracts(clientId ? all.filter((c) => c.clientId === clientId) : all);
    });
  }, [enabled, companyId, clientId]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firestore || !companyId || !clientId) return;
    if (!label.trim() || !templateTitle.trim()) {
      toast.error(String(t("maintenance.error_fields_required")));
      return;
    }
    setBusy(true);
    try {
      await createMaintenanceContract(firestore, companyId, {
        clientId,
        siteId: null,
        label: label.trim(),
        frequency,
        nextDueDate,
        interventionTemplate: { title: templateTitle.trim() },
        isActive: true,
        createdByUid: workspace?.firebaseUid ?? null,
      });
      setLabel("");
      setTemplateTitle("");
      setShowForm(false);
      toast.success(String(t("maintenance.toast_created")));
    } catch {
      toast.error(String(t("common.error")));
    } finally {
      setBusy(false);
    }
  };

  const handleDeactivate = async (id: string) => {
    if (!firestore) return;
    try {
      await deactivateMaintenanceContract(firestore, companyId, id);
      toast.success(String(t("maintenance.toast_deactivated")));
    } catch {
      toast.error(String(t("common.error")));
    }
  };

  if (!enabled) return null;

  return (
    <section data-testid="maintenance-contract-panel" className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Wrench className="h-4 w-4 text-slate-500" />
          <h3 className="text-sm font-bold text-slate-900">{t("maintenance.panel_title")}</h3>
        </div>
        {isAdmin && clientId && (
          <button
            type="button"
            data-testid="maintenance-new"
            onClick={() => setShowForm((v) => !v)}
            className="flex items-center gap-1 rounded-lg bg-slate-900 px-2.5 py-1.5 text-xs font-bold text-white hover:bg-slate-700"
          >
            <Plus className="h-3.5 w-3.5" />
            {t("maintenance.new")}
          </button>
        )}
      </div>

      {showForm && (
        <form
          onSubmit={(e) => void handleCreate(e)}
          data-testid="maintenance-form"
          className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3"
        >
          <input
            data-testid="maintenance-label"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder={String(t("maintenance.label_placeholder"))}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
          />
          <input
            data-testid="maintenance-template-title"
            value={templateTitle}
            onChange={(e) => setTemplateTitle(e.target.value)}
            placeholder={String(t("maintenance.template_title_placeholder"))}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
          />
          <div className="grid gap-2 sm:grid-cols-2">
            <select
              data-testid="maintenance-frequency"
              value={frequency}
              onChange={(e) => setFrequency(e.target.value as MaintenanceFrequency)}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
            >
              {FREQUENCIES.map((f) => (
                <option key={f} value={f}>
                  {FREQUENCY_LABELS[f]}
                </option>
              ))}
            </select>
            <input
              data-testid="maintenance-next-date"
              type="date"
              value={nextDueDate}
              onChange={(e) => setNextDueDate(e.target.value)}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
          </div>
          <button
            type="submit"
            disabled={busy}
            data-testid="maintenance-submit"
            className="w-full rounded-lg bg-slate-900 py-2 text-sm font-bold text-white disabled:opacity-50"
          >
            {t("maintenance.create")}
          </button>
        </form>
      )}

      {contracts.length === 0 ? (
        <p className="text-sm text-slate-400">{t("maintenance.empty")}</p>
      ) : (
        <ul className="space-y-2">
          {contracts.map((c) => (
            <li key={c.id}>
              <ContractCard contract={c} onDeactivate={(id) => void handleDeactivate(id)} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
