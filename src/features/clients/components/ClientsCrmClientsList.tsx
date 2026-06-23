"use client";

import { User } from "lucide-react";
import { buildClientDisplayName } from "@/features/clients/clientDisplayName";
import type { ClientRecord } from "@/features/clients/types";

export default function ClientsCrmClientsList({
  loading,
  filtered,
  selectedId,
  onSelect,
  t,
}: {
  loading: boolean;
  filtered: ClientRecord[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  t: (key: string) => string;
}) {
  return (
    <section className="min-h-[200px] rounded-lg border border-slate-100">
      <p className="border-b border-slate-100 px-3 py-2 text-xs font-bold uppercase tracking-wide text-slate-400">
        {t("crm.clients_list")}
      </p>
      <ul className="max-h-64 overflow-y-auto p-2" data-testid="crm-clients-list">
        {loading ? (
          <li className="px-2 py-4 text-center text-sm text-slate-400">{t("common.loading")}</li>
        ) : filtered.length === 0 ? (
          <li className="px-2 py-4 text-center text-sm text-slate-500">{t("crm.clients_empty")}</li>
        ) : (
          filtered.map((c) => (
            <li key={c.id}>
              <button
                type="button"
                data-testid={`crm-client-row-${c.id}`}
                onClick={() => onSelect(c.id)}
                className={`flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm transition ${
                  selectedId === c.id ? "bg-slate-900 text-white" : "hover:bg-slate-50"
                }`}
              >
                <User className="h-4 w-4 shrink-0" />
                <span className="truncate font-semibold">{buildClientDisplayName(c) || c.id}</span>
              </button>
            </li>
          ))
        )}
      </ul>
    </section>
  );
}
