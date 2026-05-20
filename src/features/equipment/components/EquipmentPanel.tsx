"use client";

import { useEffect, useState } from "react";
import { Plus, Wrench, AlertTriangle, Clock } from "lucide-react";
import { toast } from "sonner";
import { firestore } from "@/core/config/firebase";
import { useCompanyWorkspaceOptional } from "@/context/CompanyWorkspaceContext";
import {
  subscribeEquipmentByClient,
  createEquipment,
  retireEquipment,
} from "../equipmentFirestore";
import {
  type ClientEquipment,
  type EquipmentStatus,
  isServiceDueSoon,
  isServiceOverdue,
} from "../types";
import EquipmentStatusBadge from "./EquipmentStatusBadge";

interface Props {
  clientId: string;
}

const EMPTY_FORM = {
  label: "",
  brand: "",
  model: "",
  serialNumber: "",
  installDate: "",
  nextServiceDate: "",
  notes: "",
};

export default function EquipmentPanel({ clientId }: Props) {
  const workspace = useCompanyWorkspaceOptional();
  const companyId = workspace?.activeCompanyId?.trim() ?? "";

  const [items, setItems] = useState<ClientEquipment[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!firestore || !companyId) return;
    return subscribeEquipmentByClient(firestore, companyId, clientId, setItems);
  }, [companyId, clientId]);

  const handleAdd = async () => {
    if (!firestore || !companyId || !form.label.trim()) return;
    setSaving(true);
    try {
      await createEquipment(firestore, companyId, {
        clientId,
        siteId: null,
        label: form.label.trim(),
        brand: form.brand.trim() || null,
        model: form.model.trim() || null,
        serialNumber: form.serialNumber.trim() || null,
        installDate: form.installDate || null,
        nextServiceDate: form.nextServiceDate || null,
        lastServiceDate: null,
        status: "active" as EquipmentStatus,
        notes: form.notes.trim() || null,
      });
      toast.success("Équipement ajouté");
      setForm(EMPTY_FORM);
      setShowForm(false);
    } catch {
      toast.error("Erreur lors de l'ajout");
    } finally {
      setSaving(false);
    }
  };

  const handleRetire = async (id: string) => {
    if (!firestore || !companyId) return;
    try {
      await retireEquipment(firestore, companyId, id);
      toast.success("Équipement mis hors service");
    } catch {
      toast.error("Erreur");
    }
  };

  const active = items.filter((i) => i.status !== "retired");
  const retired = items.filter((i) => i.status === "retired");

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Wrench className="h-4 w-4 text-slate-500" />
          <h3 className="text-sm font-bold text-slate-900">Parc matériel</h3>
          {active.length > 0 && (
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-600">
              {active.length}
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-1 rounded-lg bg-blue-600 px-2.5 py-1.5 text-xs font-bold text-white hover:bg-blue-700"
        >
          <Plus className="h-3.5 w-3.5" /> Ajouter
        </button>
      </div>

      {showForm && (
        <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <input
              placeholder="Nom de l'équipement *"
              value={form.label}
              onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
              className="col-span-2 rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
            <input
              placeholder="Marque"
              value={form.brand}
              onChange={(e) => setForm((f) => ({ ...f, brand: e.target.value }))}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
            <input
              placeholder="Modèle"
              value={form.model}
              onChange={(e) => setForm((f) => ({ ...f, model: e.target.value }))}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
            <input
              placeholder="N° de série"
              value={form.serialNumber}
              onChange={(e) => setForm((f) => ({ ...f, serialNumber: e.target.value }))}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
            <div className="space-y-1">
              <label className="text-xs text-slate-500">Date d&apos;installation</label>
              <input
                type="date"
                value={form.installDate}
                onChange={(e) => setForm((f) => ({ ...f, installDate: e.target.value }))}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-slate-500">Prochain entretien</label>
              <input
                type="date"
                value={form.nextServiceDate}
                onChange={(e) => setForm((f) => ({ ...f, nextServiceDate: e.target.value }))}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              />
            </div>
            <textarea
              placeholder="Notes"
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              rows={2}
              className="col-span-2 rounded-lg border border-slate-200 px-3 py-2 text-sm resize-none"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => void handleAdd()}
              disabled={saving || !form.label.trim()}
              className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? "Enregistrement…" : "Enregistrer"}
            </button>
            <button
              type="button"
              onClick={() => { setShowForm(false); setForm(EMPTY_FORM); }}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50"
            >
              Annuler
            </button>
          </div>
        </div>
      )}

      {active.length > 0 && (
        <ul className="space-y-2">
          {active.map((item) => {
            const overdue = isServiceOverdue(item);
            const dueSoon = !overdue && isServiceDueSoon(item);
            return (
              <li key={item.id} className="rounded-xl border border-slate-100 bg-white p-3 space-y-1.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-900 truncate">{item.label}</p>
                    {(item.brand || item.model) && (
                      <p className="text-xs text-slate-500">{[item.brand, item.model].filter(Boolean).join(" — ")}</p>
                    )}
                    {item.serialNumber && (
                      <p className="text-xs text-slate-400">S/N : {item.serialNumber}</p>
                    )}
                  </div>
                  <EquipmentStatusBadge status={item.status} />
                </div>

                {item.nextServiceDate && (
                  <div className={`flex items-center gap-1 text-xs font-medium ${overdue ? "text-red-600" : dueSoon ? "text-amber-600" : "text-slate-400"}`}>
                    {overdue ? <AlertTriangle className="h-3.5 w-3.5" /> : <Clock className="h-3.5 w-3.5" />}
                    Entretien : {new Date(item.nextServiceDate).toLocaleDateString("fr-BE")}
                    {overdue && " — En retard"}
                    {dueSoon && " — Bientôt"}
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => void handleRetire(item.id)}
                  className="text-xs text-slate-400 hover:text-red-600 transition-colors"
                >
                  Mettre hors service
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {retired.length > 0 && (
        <details className="text-xs text-slate-400">
          <summary className="cursor-pointer hover:text-slate-600">{retired.length} équipement(s) hors service</summary>
          <ul className="mt-2 space-y-1 pl-2">
            {retired.map((item) => (
              <li key={item.id} className="text-slate-400">{item.label}</li>
            ))}
          </ul>
        </details>
      )}

      {items.length === 0 && !showForm && (
        <p className="text-sm text-slate-400">Aucun équipement enregistré pour ce client.</p>
      )}
    </section>
  );
}
