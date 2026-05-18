"use client";

import { Building2, ChevronRight } from "lucide-react";
import { useCompanyWorkspaceOptional } from "@/context/CompanyWorkspaceContext";

export default function MultiCompanyOverviewPanel() {
  const workspace = useCompanyWorkspaceOptional();
  if (!workspace) return null;

  const { memberships, activeCompanyId, setActiveCompanyId } = workspace;

  if (memberships.length <= 1) return null;

  return (
    <div data-testid="multi-company-overview-panel" className="flex flex-col gap-2">
      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 px-1">
        Mes entreprises ({memberships.length})
      </p>
      {memberships.map((m) => {
        const active = m.companyId === activeCompanyId;
        return (
          <button
            key={m.companyId}
            type="button"
            onClick={() => setActiveCompanyId(m.companyId)}
            className={`flex items-center gap-3 rounded-2xl border px-4 py-3 text-left transition ${
              active
                ? "border-black bg-black text-white"
                : "border-black/5 bg-white text-slate-800 hover:border-black/10 hover:bg-slate-50"
            }`}
          >
            <Building2 className={`h-4 w-4 shrink-0 ${active ? "text-white" : "text-slate-400"}`} />
            <div className="flex min-w-0 flex-col">
              <span className="truncate text-[13px] font-bold">{m.companyName}</span>
              <span className={`text-[10px] font-semibold uppercase ${active ? "text-white/70" : "text-slate-400"}`}>
                {m.role}
              </span>
            </div>
            {active && <ChevronRight className="ml-auto h-4 w-4 shrink-0 text-white/70" />}
          </button>
        );
      })}
    </div>
  );
}
