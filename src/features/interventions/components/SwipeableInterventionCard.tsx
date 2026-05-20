"use client";

import React from "react";
import { Intervention } from "@/features/interventions/types";
import { SlideAction } from "@/components/ui/slide-action";
import { MapPin, Navigation, Clock } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface SwipeableInterventionCardProps {
  intervention: Intervention;
  onStartRoute: () => void;
  onClick: () => void;
}

/**
 * SwipeableInterventionCard
 * Carte du dashboard technicien permettant de voir les infos de base
 * et de "Démarrer" (En route) d'un simple swipe, sans ouvrir la fiche complète.
 */
export default function SwipeableInterventionCard({
  intervention,
  onStartRoute,
  onClick,
}: SwipeableInterventionCardProps) {
  const { title, address, scheduledDate, scheduledTime, status } = intervention;

  // On affiche le slide action seulement si le statut est "assigned" (prêt à démarrer)
  const canStart = status === "assigned";

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden mb-4">
      {/* Zone cliquable pour voir les détails */}
      <div 
        className="p-4 cursor-pointer active:bg-slate-50 transition-colors"
        onClick={onClick}
      >
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-bold text-slate-800 text-lg leading-tight">{title}</h3>
          {(scheduledDate || scheduledTime) && (
            <div className="flex items-center text-slate-500 text-sm bg-slate-50 px-2 py-1 rounded-md">
              <Clock className="w-3.5 h-3.5 mr-1" />
              {scheduledTime || "N/A"}
            </div>
          )}
        </div>
        
        <div className="flex items-start text-slate-600 text-sm mt-3">
          <MapPin className="w-4 h-4 mr-2 text-slate-400 shrink-0 mt-0.5" />
          <span className="line-clamp-2">{address}</span>
        </div>
      </div>

      {/* Action Zone (Swipe) */}
      {canStart && (
        <div className="px-4 pb-4 pt-1">
          <SlideAction
            onAction={onStartRoute}
            label="Glisser pour démarrer"
            icon={Navigation}
          />
        </div>
      )}
    </div>
  );
}
