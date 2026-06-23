"use client";

import { toast } from "sonner";
import { MapPin } from "lucide-react";
import type { Intervention } from "@/features/interventions";

export function showGeofenceArrivalToast(intervention: Intervention, onConfirm: () => void) {
  toast(
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2 font-semibold text-slate-900">
        <MapPin className="h-4 w-4 text-blue-600" />
        Arrivée détectée
      </div>
      <p className="text-sm text-slate-600">
        Vous êtes à proximité de <span className="font-semibold">{intervention.address}</span>.
      </p>
      <button
        type="button"
        onClick={() => {
          onConfirm();
          toast.dismiss();
        }}
        className="mt-1 w-full rounded-lg bg-blue-600 py-2 text-sm font-bold text-white hover:bg-blue-700"
      >
        Confirmer l&apos;arrivée
      </button>
    </div>,
    {
      duration: 30_000,
      position: "top-center",
    }
  );
}
