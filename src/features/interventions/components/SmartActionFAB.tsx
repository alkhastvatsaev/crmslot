"use client";

import React from "react";
import { Play, Navigation, CheckCircle, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Intervention } from "@/features/interventions/types";

interface SmartActionFABProps {
  intervention: Intervention;
  onAction: (newStatus: Intervention["status"], actionType: string) => void;
  isOffline?: boolean;
}

/**
 * SmartActionFAB (Floating Action Button contextuel)
 * Suggère la prochaine étape logique au technicien pour minimiser les clics.
 */
export default function SmartActionFAB({ intervention, onAction, isOffline }: SmartActionFABProps) {
  const { status } = intervention;

  // Déterminer l'action principale selon le statut actuel
  let actionLabel = "";
  let ActionIcon = Play;
  let nextStatus: Intervention["status"] | null = null;
  let actionType = "";
  let colorClass = "";

  switch (status) {
    case "assigned":
      actionLabel = "Je pars en intervention";
      ActionIcon = Navigation;
      nextStatus = "en_route";
      actionType = "start_route";
      colorClass = "bg-blue-600 hover:bg-blue-700 text-white";
      break;
    case "en_route":
      actionLabel = "Arrivé sur site";
      ActionIcon = Play;
      nextStatus = "in_progress";
      actionType = "arrive_site";
      colorClass = "bg-amber-500 hover:bg-amber-600 text-white";
      break;
    case "in_progress":
      actionLabel = "Terminer l'intervention";
      ActionIcon = CheckCircle;
      nextStatus = "done"; // En réalité ça ouvrira un modal de fin (matériel/photos/signature)
      actionType = "finish_job";
      colorClass = "bg-green-600 hover:bg-green-700 text-white";
      break;
    default:
      // Pas de FAB principal évident, on pourrait renvoyer null
      return null;
  }

  return (
    <div className="fixed bottom-6 left-0 right-0 z-50 flex justify-center px-4 pointer-events-none">
      <Button
        size="lg"
        onClick={() => nextStatus && onAction(nextStatus, actionType)}
        disabled={false /* TODO: Gérer un état de chargement/mutation */}
        className={`pointer-events-auto shadow-2xl rounded-full px-6 py-6 h-auto text-base font-semibold flex items-center gap-3 transition-transform active:scale-95 ${colorClass}`}
        data-testid={`smart-fab-${actionType}`}
      >
        <ActionIcon className="w-5 h-5" />
        {actionLabel}
      </Button>
    </div>
  );
}
