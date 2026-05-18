"use client";

import { Calendar, RefreshCw, Trash2 } from "lucide-react";
import { FREQUENCY_LABELS, type MaintenanceContract } from "../types";

type Props = {
  contract: MaintenanceContract;
  onDeactivate: (id: string) => void;
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-BE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function isDue(nextDueDate: string): boolean {
  return nextDueDate <= new Date().toISOString().slice(0, 10);
}

export default function ContractCard({ contract, onDeactivate }: Props) {
  const due = isDue(contract.nextDueDate);

  return (
    <div
      data-testid={`contract-card-${contract.id}`}
      className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm space-y-2"
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-bold text-slate-900">{contract.label}</p>
          <p className="text-xs text-slate-500">{contract.interventionTemplate.title}</p>
        </div>
        <button
          type="button"
          data-testid={`contract-deactivate-${contract.id}`}
          onClick={() => onDeactivate(contract.id)}
          className="rounded-lg p-1.5 text-slate-300 hover:text-red-500"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      <div className="flex items-center gap-3 text-xs text-slate-500">
        <span className="flex items-center gap-1">
          <RefreshCw className="h-3 w-3" />
          {FREQUENCY_LABELS[contract.frequency]}
        </span>
        <span
          className={`flex items-center gap-1 font-semibold ${due ? "text-red-600" : "text-slate-500"}`}
        >
          <Calendar className="h-3 w-3" />
          {due ? "Dûe — " : "Prochaine : "}
          {formatDate(contract.nextDueDate)}
        </span>
      </div>
    </div>
  );
}
