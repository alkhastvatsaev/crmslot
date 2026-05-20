"use client";

import { useEffect, useState } from "react";
import { CheckSquare, Square, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { firestore } from "@/core/config/firebase";
import { useCompanyWorkspaceOptional } from "@/context/CompanyWorkspaceContext";
import {
  subscribeChecklist,
  createChecklist,
  updateChecklistItem,
} from "../checklistFirestore";
import {
  buildDefaultChecklist,
  isChecklistComplete,
  checklistProgress,
} from "../types";
import type { InterventionChecklist, ChecklistItem } from "../types";

export default function InterventionChecklistPanel({
  interventionId,
}: {
  interventionId: string;
}) {
  const workspace = useCompanyWorkspaceOptional();
  const companyId = workspace?.activeCompanyId?.trim() ?? "";
  const uid = workspace?.firebaseUid ?? "";

  const [checklist, setChecklist] = useState<InterventionChecklist | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!firestore || !companyId) return;
    setLoading(true);
    return subscribeChecklist(firestore, interventionId, (cl) => {
      setChecklist(cl);
      setLoading(false);
    });
  }, [interventionId, companyId]);

  const handleInit = async () => {
    if (!firestore || !companyId) return;
    try {
      await createChecklist(firestore, buildDefaultChecklist(interventionId, companyId));
    } catch {
      toast.error("Erreur lors de la création de la checklist.");
    }
  };

  const handleToggle = async (itemId: string) => {
    if (!checklist || !firestore) return;
    const now = new Date().toISOString();
    const updatedItems: ChecklistItem[] = checklist.items.map((item) =>
      item.id === itemId
        ? {
            ...item,
            checked: !item.checked,
            checkedAt: !item.checked ? now : null,
            checkedByUid: !item.checked ? uid : null,
          }
        : item,
    );
    try {
      await updateChecklistItem(firestore, checklist.id, updatedItems);
    } catch {
      toast.error("Erreur lors de la mise à jour.");
    }
  };

  const progress = checklist ? checklistProgress(checklist) : null;
  const complete = checklist ? isChecklistComplete(checklist) : false;

  if (loading) {
    return <p className="text-sm text-slate-400">Chargement…</p>;
  }

  if (!checklist) {
    return (
      <div data-testid="checklist-empty" className="space-y-2">
        <p className="text-sm text-slate-500">Aucune checklist pour cette intervention.</p>
        <button
          type="button"
          data-testid="checklist-init"
          onClick={() => void handleInit()}
          className="rounded-lg bg-slate-900 px-3 py-2 text-xs font-bold text-white hover:bg-slate-700"
        >
          Créer la checklist
        </button>
      </div>
    );
  }

  return (
    <section data-testid="intervention-checklist-panel" className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CheckSquare className="h-4 w-4 text-slate-500" />
          <h3 className="text-sm font-bold text-slate-900">Checklist</h3>
        </div>
        <div className="flex items-center gap-2">
          {complete ? (
            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
              Complète
            </span>
          ) : (
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700">
              {progress?.done}/{progress?.total}
            </span>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 w-full rounded-full bg-slate-100">
        <div
          className={`h-1.5 rounded-full transition-all ${complete ? "bg-emerald-500" : "bg-blue-500"}`}
          style={{ width: `${progress ? (progress.done / progress.total) * 100 : 0}%` }}
        />
      </div>

      <ul className="space-y-1.5">
        {checklist.items.map((item) => (
          <li key={item.id} className="flex items-start gap-2">
            <button
              type="button"
              data-testid={`checklist-item-${item.id}`}
              onClick={() => void handleToggle(item.id)}
              className="mt-0.5 shrink-0 text-slate-400 hover:text-blue-600"
            >
              {item.checked ? (
                <CheckSquare className="h-4 w-4 text-emerald-600" />
              ) : (
                <Square className="h-4 w-4" />
              )}
            </button>
            <span
              className={`text-sm ${item.checked ? "line-through text-slate-400" : "text-slate-800"}`}
            >
              {item.label}
              {item.required && !item.checked && (
                <AlertCircle className="ml-1 inline h-3 w-3 text-amber-500" />
              )}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
