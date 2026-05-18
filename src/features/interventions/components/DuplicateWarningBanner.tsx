"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, ExternalLink } from "lucide-react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { firestore } from "@/core/config/firebase";
import { findPotentialDuplicates, type DuplicateMatch } from "@/features/interventions/detectDuplicates";
import type { Intervention } from "@/features/interventions/types";

interface Props {
  interventionId: string;
  address: string;
  problem: string;
  companyId: string;
}

export default function DuplicateWarningBanner({ interventionId, address, problem, companyId }: Props) {
  const [matches, setMatches] = useState<DuplicateMatch[]>([]);

  useEffect(() => {
    if (!firestore || !address || !problem || !companyId) return;

    const q = query(
      collection(firestore, "interventions"),
      where("companyId", "==", companyId),
    );

    getDocs(q).then((snap) => {
      const all = snap.docs
        .map((d) => ({ id: d.id, ...d.data() } as Intervention))
        .filter((iv) => iv.id !== interventionId);
      setMatches(findPotentialDuplicates({ address, problem }, all));
    });
  }, [interventionId, address, problem, companyId]);

  if (matches.length === 0) return null;

  return (
    <div
      data-testid="duplicate-warning-banner"
      className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-3 flex flex-col gap-2"
    >
      <div className="flex items-center gap-2">
        <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" />
        <span className="text-[12px] font-bold text-amber-800">
          {matches.length} doublon{matches.length > 1 ? "s" : ""} probable{matches.length > 1 ? "s" : ""}
        </span>
      </div>
      {matches.map((m) => (
        <div key={m.intervention.id} className="flex items-center justify-between gap-2 rounded-lg bg-white border border-amber-100 px-3 py-2">
          <div className="flex min-w-0 flex-col">
            <span className="truncate text-[12px] font-semibold text-slate-700">
              {m.intervention.title || m.intervention.problem || m.intervention.address}
            </span>
            <span className="text-[10px] text-slate-400">{m.reason} — {Math.round(m.score * 100)}%</span>
          </div>
          <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700 uppercase">
            {m.intervention.status}
          </span>
        </div>
      ))}
    </div>
  );
}
