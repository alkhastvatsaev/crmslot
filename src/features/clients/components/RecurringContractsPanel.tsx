"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, RefreshCw, CheckCircle2 } from "lucide-react";
import { useCompanyWorkspaceOptional } from "@/context/CompanyWorkspaceContext";
import {
  subscribeRecurringContracts,
  createRecurringContract,
  deleteRecurringContract,
  updateRecurringContract,
  nextDueDateAfter,
  type RecurringContract,
  type RecurrenceInterval,
} from "@/features/clients/recurringContracts";
import { addDoc, collection } from "firebase/firestore";
import { firestore } from "@/core/config/firebase";

const INTERVALS: { value: RecurrenceInterval; label: string }[] = [
  { value: "weekly", label: "Chaque semaine" },
  { value: "biweekly", label: "Toutes les 2 semaines" },
  { value: "monthly", label: "Chaque mois" },
  { value: "quarterly", label: "Chaque trimestre" },
];

const INTERVAL_LABELS: Record<RecurrenceInterval, string> = {
  weekly: "Hebdo",
  biweekly: "Bi-hebdo",
  monthly: "Mensuel",
  quarterly: "Trimestriel",
};

export default function RecurringContractsPanel() {
  const workspace = useCompanyWorkspaceOptional();
  const companyId = workspace?.activeCompanyId ?? "";

  const [contracts, setContracts] = useState<RecurringContract[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [generating, setGenerating] = useState<string | null>(null);

  const [form, setForm] = useState({
    clientName: "",
    address: "",
    problemDescription: "",
    interval: "monthly" as RecurrenceInterval,
    nextDueDate: new Date().toISOString().slice(0, 10),
  });

  useEffect(() => {
    if (!companyId) return;
    return subscribeRecurringContracts(companyId, setContracts);
  }, [companyId]);

  const handleCreate = async () => {
    if (!form.clientName || !form.address) return;
    await createRecurringContract({ ...form, companyId, active: true });
    setForm({
      clientName: "",
      address: "",
      problemDescription: "",
      interval: "monthly",
      nextDueDate: new Date().toISOString().slice(0, 10),
    });
    setShowForm(false);
  };

  const handleGenerate = async (contract: RecurringContract) => {
    if (!firestore) return;
    setGenerating(contract.id);
    try {
      await addDoc(collection(firestore, "interventions"), {
        title: contract.problemDescription || "Contrat récurrent",
        address: contract.address,
        problem: contract.problemDescription,
        status: "pending",
        companyId: contract.companyId,
        clientId: contract.clientId ?? null,
        scheduledDate: contract.nextDueDate,
        createdAt: new Date().toISOString(),
        recurringContractId: contract.id,
      });
      await updateRecurringContract(contract.id, {
        lastGeneratedAt: new Date().toISOString(),
        nextDueDate: nextDueDateAfter(contract.nextDueDate, contract.interval),
      });
    } finally {
      setGenerating(null);
    }
  };

  const isDue = (contract: RecurringContract) => new Date(contract.nextDueDate) <= new Date();

  return (
    <div data-testid="recurring-contracts-panel" className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="text-[15px] font-bold text-slate-800">Contrats récurrents</h3>
        <button
          type="button"
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1.5 rounded-xl bg-black px-3 py-1.5 text-[12px] font-bold text-white hover:bg-black/80"
        >
          <Plus className="h-3.5 w-3.5" /> Nouveau
        </button>
      </div>

      {showForm && (
        <div className="flex flex-col gap-3 rounded-[16px] border border-black/5 bg-slate-50 p-4">
          <input
            placeholder="Nom client"
            value={form.clientName}
            onChange={(e) => setForm((f) => ({ ...f, clientName: e.target.value }))}
            className="w-full rounded-xl border border-black/8 bg-white px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-black/10"
          />
          <input
            placeholder="Adresse"
            value={form.address}
            onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
            className="w-full rounded-xl border border-black/8 bg-white px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-black/10"
          />
          <input
            placeholder="Description (optionnel)"
            value={form.problemDescription}
            onChange={(e) => setForm((f) => ({ ...f, problemDescription: e.target.value }))}
            className="w-full rounded-xl border border-black/8 bg-white px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-black/10"
          />
          <div className="flex gap-2">
            <select
              value={form.interval}
              onChange={(e) =>
                setForm((f) => ({ ...f, interval: e.target.value as RecurrenceInterval }))
              }
              className="flex-1 rounded-xl border border-black/8 bg-white px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-black/10"
            >
              {INTERVALS.map((i) => (
                <option key={i.value} value={i.value}>
                  {i.label}
                </option>
              ))}
            </select>
            <input
              type="date"
              value={form.nextDueDate}
              onChange={(e) => setForm((f) => ({ ...f, nextDueDate: e.target.value }))}
              className="flex-1 rounded-xl border border-black/8 bg-white px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-black/10"
            />
          </div>
          <button
            type="button"
            onClick={handleCreate}
            disabled={!form.clientName || !form.address}
            className="w-full rounded-xl bg-black py-2 text-[13px] font-bold text-white disabled:opacity-40"
          >
            Créer le contrat
          </button>
        </div>
      )}

      {contracts.length === 0 && !showForm && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 p-8 text-center">
          <RefreshCw className="mb-2 h-8 w-8 text-slate-300" />
          <p className="text-[13px] font-medium text-slate-500">Aucun contrat récurrent</p>
        </div>
      )}

      <div className="flex flex-col gap-2">
        {contracts.map((c) => {
          const due = isDue(c);
          return (
            <div
              key={c.id}
              className={`flex items-center justify-between gap-3 rounded-2xl border px-4 py-3 ${due ? "border-amber-200 bg-amber-50" : "border-black/5 bg-white"}`}
            >
              <div className="flex min-w-0 flex-col">
                <span className="truncate text-[14px] font-bold text-slate-800">
                  {c.clientName}
                </span>
                <span className="truncate text-[11px] text-slate-500">{c.address}</span>
                <div className="mt-1 flex items-center gap-2">
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                    {INTERVAL_LABELS[c.interval]}
                  </span>
                  <span
                    className={`text-[11px] font-semibold ${due ? "text-amber-700" : "text-slate-500"}`}
                  >
                    {due ? "⚠ Dû le " : "Prochain : "}
                    {c.nextDueDate}
                  </span>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-1.5">
                <button
                  type="button"
                  disabled={generating === c.id}
                  onClick={() => handleGenerate(c)}
                  title="Générer une intervention"
                  className={`flex h-8 w-8 items-center justify-center rounded-xl transition ${due ? "bg-amber-500 text-white hover:bg-amber-600" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
                >
                  {generating === c.id ? (
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => deleteRecurringContract(c.id)}
                  className="flex h-8 w-8 items-center justify-center rounded-xl bg-red-50 text-red-500 transition hover:bg-red-100"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
