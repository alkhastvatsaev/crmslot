"use client";

import { useState } from "react";
import { Route, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { optimizeTourOrder, getCurrentPosition } from "@/features/interventions/optimizeTourOrder";
import type { Intervention } from "@/features/interventions";

type Props = {
  missions: Intervention[];
  onOptimized: (ordered: Intervention[]) => void;
  className?: string;
};

export default function TourOptimizeButton({ missions, onOptimized, className }: Props) {
  const [loading, setLoading] = useState(false);

  const handleOptimize = async () => {
    if (missions.length < 2) {
      toast.info("Au moins 2 missions sont nécessaires pour optimiser la tournée.");
      return;
    }
    setLoading(true);
    try {
      const pos = await getCurrentPosition();
      const ordered = optimizeTourOrder(missions, pos);
      onOptimized(ordered);
      toast.success("Tournée optimisée !");
    } catch {
      // Fallback: use first mission location as start
      const first = missions.find((m) => m.location?.lat && m.location?.lng);
      if (first) {
        const ordered = optimizeTourOrder(missions, first.location);
        onOptimized(ordered);
        toast.success("Tournée optimisée (position GPS indisponible).");
      } else {
        toast.error("Impossible d'optimiser : aucune adresse géocodée.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      data-testid="tour-optimize-btn"
      disabled={loading || missions.length < 2}
      onClick={() => void handleOptimize()}
      className={
        className ??
        "group flex w-full items-center gap-3 rounded-2xl border border-transparent bg-white/5 p-4 text-left transition-all hover:border-white/10 hover:bg-white/10 active:scale-[0.98] disabled:opacity-40"
      }
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/5">
        {loading ? (
          <Loader2 className="h-5 w-5 animate-spin text-emerald-400" />
        ) : (
          <Route className="h-5 w-5 text-emerald-400 transition-colors group-hover:text-emerald-300" />
        )}
      </div>
      <div>
        <p className="text-sm font-semibold leading-tight text-white">Optimiser la tournée</p>
        <p className="mt-0.5 text-xs text-white/40">Réordonner par distance</p>
      </div>
    </button>
  );
}
