"use client";

import { useCallback } from "react";
import { useFeatureFlag } from "@/core/useFeatureFlags";
import { useGeofenceMonitor } from "../useGeofenceMonitor";
import { geofenceArrivalNextStatus } from "../geofenceArrival";
import { showGeofenceArrivalToast } from "./GeofenceArrivalToast";
import { transitionInterventionFromTechnician } from "@/features/interventions/workflow/transitionInterventionFromTechnician";
import type { Intervention } from "@/features/interventions/types";

type Props = {
  missions: Intervention[];
};

/**
 * Surveille le GPS du technicien (flag `geofenceAuto`) et propose la
 * transition de statut quand il arrive à proximité d'une mission.
 * Ne rend rien — uniquement effets (watchPosition + toast).
 */
export default function TechnicianGeofenceWatcher({ missions }: Props) {
  const enabled = useFeatureFlag("geofenceAuto");

  const handleArrival = useCallback(
    ({ intervention }: { intervention: Intervention; distanceMeters: number }) => {
      showGeofenceArrivalToast(intervention, () => {
        const toStatus = geofenceArrivalNextStatus(intervention.status);
        if (!toStatus) return;
        void transitionInterventionFromTechnician({
          interventionId: intervention.id,
          iv: intervention,
          toStatus,
          note: "Arrivée détectée par géolocalisation",
        }).catch(() => {
          // Transition refusée (statut déjà avancé) — le toast reste informatif.
        });
      });
    },
    []
  );

  useGeofenceMonitor(missions, { enabled, onArrival: handleArrival });

  return null;
}
