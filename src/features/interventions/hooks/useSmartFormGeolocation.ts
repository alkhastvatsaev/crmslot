"use client";

import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";
import { REQUESTER_GEOLOC_ADDRESS_PENDING } from "@/features/interventions/smartInterventionConstants";
import { resolveInterventionAddressFromCoords } from "@/features/interventions/smartFormReverseGeocode";

/** Haute précision GPS peut bloquer 15–60 s — réseau WiFi suffit (~1–2 s). */
const GEOLOC_OPTIONS: PositionOptions = {
  enableHighAccuracy: false,
  timeout: 8_000,
  maximumAge: 300_000,
};

export function useSmartFormGeolocation(
  setAddress: React.Dispatch<React.SetStateAction<string>>,
  setPlaceLatLng: React.Dispatch<React.SetStateAction<{ lat: number; lng: number } | undefined>>
) {
  const [locatingAddress, setLocatingAddress] = useState(false);
  const addressInputRef = useRef<HTMLInputElement>(null);

  const fillAddressFromGeolocation = useCallback(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      toast.error("Géolocalisation indisponible sur cet appareil");
      return;
    }
    setLocatingAddress(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setPlaceLatLng({ lat, lng });
        setAddress(REQUESTER_GEOLOC_ADDRESS_PENDING);
        try {
          const { formatted, location } = await resolveInterventionAddressFromCoords(lat, lng);
          setPlaceLatLng(location);
          if (formatted) {
            setAddress(formatted);
          } else {
            setAddress("");
            toast.message("Position enregistrée", {
              description: "Complétez l'adresse si besoin.",
            });
          }
        } catch {
          toast.error("Impossible de récupérer l'adresse");
          setAddress((prev) => (prev === REQUESTER_GEOLOC_ADDRESS_PENDING ? "" : prev));
        } finally {
          setLocatingAddress(false);
          queueMicrotask(() => addressInputRef.current?.focus());
        }
      },
      () => {
        setLocatingAddress(false);
        toast.error("Localisation refusée ou indisponible");
        queueMicrotask(() => addressInputRef.current?.focus());
      },
      GEOLOC_OPTIONS
    );
  }, [setAddress, setPlaceLatLng]);

  return { locatingAddress, addressInputRef, fillAddressFromGeolocation };
}
