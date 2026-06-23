"use client";

import { Search, MapPin, Clock, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { Intervention } from "@/features/interventions";
import { cn } from "@/lib/utils";

const STATUS_LABELS: Record<string, string> = {
  pending: "Demande reçue",
  pending_needs_address: "Adresse requise",
  searching: "Recherche en cours",
  processing: "En cours...",
  assigned: "Technicien assigné",
  en_route: "En route",
  on_site: "Sur place",
  in_progress: "Sur place",
  done: "Terminée",
  invoiced: "Facturée",
};

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-slate-100 text-slate-800 border-slate-200",
  pending_needs_address: "bg-amber-100 text-amber-800 border-amber-200",
  searching: "bg-amber-100 text-amber-800 border-amber-200",
  processing: "bg-blue-100 text-blue-800 border-blue-200",
  assigned: "bg-indigo-100 text-indigo-800 border-indigo-200",
  en_route: "bg-blue-100 text-blue-800 border-blue-200",
  on_site: "bg-indigo-100 text-indigo-800 border-indigo-200",
  in_progress: "bg-indigo-100 text-indigo-800 border-indigo-200",
  done: "bg-emerald-100 text-emerald-800 border-emerald-200",
  invoiced: "bg-slate-100 text-slate-800 border-slate-200",
};

const TIMELINE_STEPS = [
  { id: "pending", title: "Demande reçue", activeDesc: "Votre demande a bien été enregistrée" },
  {
    id: "searching",
    title: "Recherche d'un technicien",
    activeDesc: "Recherche du meilleur profil",
  },
  { id: "processing", title: "En cours...", activeDesc: "Analyse de votre demande" },
  {
    id: "assigned",
    title: "Technicien assigné",
    activeDesc: "Un expert a pris en charge votre demande",
  },
  { id: "en_route", title: "En route", activeDesc: "Le technicien est en chemin vers vous" },
  { id: "on_site", title: "Sur place", activeDesc: "Le technicien est arrivé et intervient" },
  {
    id: "done",
    title: "Intervention terminée",
    activeDesc: "L'intervention a été réalisée avec succès",
  },
];

function getStatusIndex(status: string): number {
  switch (status) {
    case "pending":
    case "pending_needs_address":
      return 0;
    case "searching":
      return 1;
    case "processing":
      return 2;
    case "assigned":
      return 3;
    case "en_route":
      return 4;
    case "on_site":
    case "in_progress":
      return 5;
    case "done":
    case "invoiced":
      return 6;
    default:
      return 0;
  }
}

type Props = {
  searchName: string;
  setSearchName: (v: string) => void;
  isSearching: boolean;
  searchResult: Intervention | "not_found" | null;
  handleSearch: (e: React.FormEvent) => void;
};

export default function InterventionTrackingSection({
  searchName,
  setSearchName,
  isSearching,
  searchResult,
  handleSearch,
}: Props) {
  return (
    <div className="flex flex-col rounded-[24px] border border-black/[0.06] bg-gradient-to-b from-white/96 via-white/90 to-slate-50/85 p-6 shadow-[0_12px_40px_-16px_rgba(15,23,42,0.12)] backdrop-blur-xl">
      <h3 className="text-[18px] font-extrabold text-slate-800 mb-1">Suivi de demande</h3>
      <p className="text-[13px] font-medium text-slate-500 mb-4">
        Entrez votre nom de famille pour voir l&apos;état de votre intervention en temps réel.
      </p>

      <form onSubmit={handleSearch} className="flex w-full gap-2 mb-2">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchName}
            onChange={(e) => setSearchName(e.target.value)}
            placeholder="Ex: Dupont"
            className="w-full rounded-[14px] border border-black/[0.06] bg-white px-10 py-2.5 text-[14px] font-medium text-slate-900 outline-none focus-visible:ring-2 focus-visible:ring-slate-900/15 transition-all shadow-sm"
          />
        </div>
        <button
          type="submit"
          disabled={isSearching || !searchName.trim()}
          className="inline-flex shrink-0 items-center justify-center rounded-[14px] bg-blue-600 px-4 py-2.5 text-[14px] font-bold text-white shadow-[0_8px_16px_-6px_rgba(37,99,235,0.4)] disabled:opacity-50 hover:bg-blue-700 transition-colors"
        >
          {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : "Suivre"}
        </button>
      </form>

      {searchResult && (
        <div className="mt-4 animate-in fade-in slide-in-from-top-2 duration-300">
          {searchResult === "not_found" ? (
            <div className="flex items-center gap-3 rounded-[16px] border border-amber-200/60 bg-amber-50/80 p-4">
              <AlertCircle className="h-5 w-5 text-amber-500 shrink-0" />
              <p className="text-[13px] font-medium text-amber-800 leading-tight">
                Aucune demande trouvée pour &quot;<strong>{searchName}</strong>&quot;. Vérifiez
                l&apos;orthographe ou connectez-vous.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-3 rounded-[18px] border border-blue-100 bg-gradient-to-br from-blue-50/50 to-white p-4 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-blue-500 rounded-l-[18px]"></div>

              <div className="flex items-start justify-between gap-2">
                <div className="flex flex-col">
                  <span className="text-[15px] font-bold text-slate-800 leading-tight">
                    {searchResult.title || "Intervention"}
                  </span>
                  <span className="text-[12px] font-medium text-slate-500 mt-0.5">
                    Demande au nom de {searchName.toUpperCase()}
                  </span>
                </div>
                <span
                  className={cn(
                    "px-2.5 py-1 rounded-full text-[11px] font-bold border whitespace-nowrap",
                    STATUS_COLORS[searchResult.status] ||
                      "bg-slate-100 text-slate-800 border-slate-200"
                  )}
                >
                  {STATUS_LABELS[searchResult.status] || searchResult.status}
                </span>
              </div>

              <div className="flex flex-col gap-2 mt-2 pt-3 border-t border-black/[0.04]">
                {searchResult.address && (
                  <div className="flex items-start gap-2">
                    <MapPin className="h-3.5 w-3.5 text-slate-400 mt-0.5 shrink-0" />
                    <span className="text-[13px] font-medium text-slate-600 line-clamp-2 leading-tight">
                      {searchResult.address}
                    </span>
                  </div>
                )}
                {searchResult.time && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    <span className="text-[13px] font-bold text-slate-700">
                      {searchResult.time}
                    </span>
                  </div>
                )}
              </div>

              {/* Timeline des étapes complète */}
              <div className="mt-3 pt-4 border-t border-black/[0.04] flex flex-col relative">
                {TIMELINE_STEPS.map((step, index) => {
                  const currentIndex = getStatusIndex((searchResult as Intervention).status);
                  const isPast = index < currentIndex;
                  const isActive = index === currentIndex;
                  const isLast = index === TIMELINE_STEPS.length - 1;

                  return (
                    <div
                      key={step.id}
                      className={cn("flex items-start gap-3 relative", !isLast && "pb-6")}
                    >
                      {!isLast && (
                        <div className="absolute left-[11px] top-6 bottom-0 w-0.5 bg-slate-200/60" />
                      )}
                      {!isLast && isPast && (
                        <div className="absolute left-[11px] top-6 bottom-0 w-0.5 bg-emerald-400" />
                      )}

                      <div
                        className={cn(
                          "h-6 w-6 rounded-full flex items-center justify-center shrink-0 border-2 relative z-10 transition-colors duration-300 bg-white",
                          isPast
                            ? "border-emerald-500 bg-emerald-500 text-white"
                            : isActive && step.id === "done"
                              ? "border-emerald-500 bg-emerald-500 text-white"
                              : isActive
                                ? "border-blue-500 text-blue-500"
                                : "border-slate-200 text-slate-300"
                        )}
                      >
                        {isPast || (isActive && step.id === "done") ? (
                          <CheckCircle2 className="h-3.5 w-3.5" />
                        ) : isActive ? (
                          <div className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                          </div>
                        ) : (
                          <div className="h-1.5 w-1.5 rounded-full bg-slate-200" />
                        )}
                      </div>

                      <div className="flex flex-col pt-0.5">
                        <span
                          className={cn(
                            "text-[13px] font-bold leading-none transition-colors duration-300",
                            isPast || isActive ? "text-slate-800" : "text-slate-400"
                          )}
                        >
                          {step.title}
                        </span>
                        {isActive && step.activeDesc && (
                          <span
                            className={cn(
                              "text-[11.5px] font-medium mt-1.5 animate-in fade-in slide-in-from-top-1",
                              step.id === "done" ? "text-emerald-600" : "text-blue-600"
                            )}
                          >
                            {step.activeDesc}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
