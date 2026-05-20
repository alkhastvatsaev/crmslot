"use client";

import { useEffect, useState } from "react";
import { AlertOctagon, Plus, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { firestore } from "@/core/config/firebase";
import { useCompanyWorkspaceOptional } from "@/context/CompanyWorkspaceContext";
import {
  subscribeClaimsByIntervention,
  createClaim,
  updateClaimStatus,
} from "../claimsFirestore";
import {
  CLAIM_STATUS_LABELS,
  CLAIM_CATEGORY_LABELS,
  CLAIM_STATUS_STYLES,
  type Claim,
  type ClaimCategory,
} from "../types";

const CATEGORIES: ClaimCategory[] = ["quality", "delay", "billing", "material", "other"];

export default function ClaimPanel({ interventionId }: { interventionId: string }) {
  const workspace = useCompanyWorkspaceOptional();
  const companyId = workspace?.activeCompanyId?.trim() ?? "";

  const [claims, setClaims] = useState<Claim[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [category, setCategory] = useState<ClaimCategory>("quality");
  const [description, setDescription] = useState("");
  const [busy, setBusy] = useState(false);
  const [resolutionMap, setResolutionMap] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!firestore || !companyId) return;
    return subscribeClaimsByIntervention(firestore, companyId, interventionId, setClaims);
  }, [companyId, interventionId]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firestore || !companyId || !description.trim()) return;
    setBusy(true);
    try {
      await createClaim(firestore, companyId, {
        interventionId,
        category,
        description: description.trim(),
        clientId: null,
        clientName: null,
        createdByUid: workspace?.firebaseUid ?? null,
      });
      setDescription(""); setShowForm(false);
      toast.success("Réclamation créée");
    } catch { toast.error("Erreur"); }
    finally { setBusy(false); }
  };

  const handleResolve = async (claim: Claim, status: "resolved" | "rejected") => {
    if (!firestore) return;
    try {
      await updateClaimStatus(firestore, companyId, claim.id, status, resolutionMap[claim.id]);
      toast.success(status === "resolved" ? "Réclamation résolue" : "Réclamation rejetée");
    } catch { toast.error("Erreur"); }
  };

  return (
    <section data-testid="claim-panel" className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertOctagon className="h-4 w-4 text-slate-500" />
          <h3 className="text-sm font-bold text-slate-900">Réclamations / SAV</h3>
          {claims.filter((c) => c.status === "open").length > 0 && (
            <span className="rounded-full bg-red-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
              {claims.filter((c) => c.status === "open").length}
            </span>
          )}
        </div>
        <button type="button" data-testid="claim-new" onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-1 rounded-lg bg-red-600 px-2.5 py-1.5 text-xs font-bold text-white hover:bg-red-700">
          <Plus className="h-3.5 w-3.5" /> Réclamation
        </button>
      </div>

      {showForm && (
        <form onSubmit={(e) => void handleCreate(e)} data-testid="claim-form"
          className="space-y-2 rounded-xl border border-red-100 bg-red-50 p-4">
          <select data-testid="claim-category" value={category}
            onChange={(e) => setCategory(e.target.value as ClaimCategory)}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm">
            {CATEGORIES.map((c) => <option key={c} value={c}>{CLAIM_CATEGORY_LABELS[c]}</option>)}
          </select>
          <textarea data-testid="claim-description" value={description}
            onChange={(e) => setDescription(e.target.value)} rows={3}
            placeholder="Décrivez le problème…"
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm resize-none" />
          <button type="submit" disabled={busy || !description.trim()} data-testid="claim-submit"
            className="w-full rounded-lg bg-red-600 py-2 text-sm font-bold text-white disabled:opacity-50">
            Enregistrer
          </button>
        </form>
      )}

      {claims.length === 0 ? (
        <p className="text-sm text-slate-400">Aucune réclamation.</p>
      ) : (
        <ul className="space-y-2">
          {claims.map((claim) => (
            <li key={claim.id} data-testid={`claim-row-${claim.id}`}
              className="rounded-xl border border-slate-100 bg-white p-3 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-slate-600">
                  {CLAIM_CATEGORY_LABELS[claim.category]}
                </span>
                <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold", CLAIM_STATUS_STYLES[claim.status])}>
                  {CLAIM_STATUS_LABELS[claim.status]}
                </span>
              </div>
              <p className="text-sm text-slate-800">{claim.description}</p>
              {claim.status === "open" || claim.status === "in_review" ? (
                <div className="space-y-1.5">
                  <input
                    value={resolutionMap[claim.id] ?? ""}
                    onChange={(e) => setResolutionMap((m) => ({ ...m, [claim.id]: e.target.value }))}
                    placeholder="Résolution (optionnel)…"
                    className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-xs"
                  />
                  <div className="flex gap-2">
                    <button type="button" data-testid={`claim-resolve-${claim.id}`}
                      onClick={() => void handleResolve(claim, "resolved")}
                      className="flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1.5 text-xs font-bold text-white">
                      <CheckCircle className="h-3 w-3" /> Résoudre
                    </button>
                    <button type="button" data-testid={`claim-reject-${claim.id}`}
                      onClick={() => void handleResolve(claim, "rejected")}
                      className="flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-600">
                      <XCircle className="h-3 w-3" /> Rejeter
                    </button>
                  </div>
                </div>
              ) : claim.resolution ? (
                <p className="text-xs italic text-slate-500">Résolution : {claim.resolution}</p>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
