"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type MutableRefObject,
  type Ref,
} from "react";
import { loadGoogleMapsScript } from "@/features/interventions/googleMapsPlacesLoader";
import { REQUESTER_GEOLOC_ADDRESS_PENDING } from "@/features/interventions/smartInterventionConstants";
import {
  MAX_RESULTS,
  MIN_INPUT_LEN,
  PREDICT_DEBOUNCE_MS,
  type GMaps,
  type ListBoxRect,
  type PlacePrediction,
} from "@/features/interventions/hooks/smartFormAddressAutocompleteTypes";

type Args = {
  value: string;
  onPlaceSelect: (formattedAddress: string, latLng: { lat: number; lng: number }) => void;
  inputRef: MutableRefObject<HTMLInputElement | null>;
};

export function assignSmartFormAddressInputRef(
  node: HTMLInputElement | null,
  local: MutableRefObject<HTMLInputElement | null>,
  outer: Ref<HTMLInputElement> | undefined
) {
  local.current = node;
  if (typeof outer === "function") outer(node);
  else if (outer && typeof outer === "object")
    (outer as MutableRefObject<HTMLInputElement | null>).current = node;
}

export function useSmartFormAddressAutocomplete({ value, onPlaceSelect, inputRef }: Args) {
  const debounceRef = useRef<number | null>(null);

  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [predictions, setPredictions] = useState<PlacePrediction[]>([]);
  const [activeIdx, setActiveIdx] = useState(-1);
  const [listBoxRect, setListBoxRect] = useState<ListBoxRect | null>(null);

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY?.trim() ?? "";

  const fetchPredictions = useCallback(
    (input: string) => {
      if (!apiKey || input.trim().length < MIN_INPUT_LEN) {
        setPredictions([]);
        setLoading(false);
        return;
      }

      void (async () => {
        try {
          await loadGoogleMapsScript(apiKey);
          const g = window as unknown as { google?: GMaps };
          const google = g.google;
          if (!google?.maps?.places?.AutocompleteService) {
            setPredictions([]);
            setLoading(false);
            return;
          }

          const service = new google.maps.places.AutocompleteService();
          const OK = google.maps.places.PlacesServiceStatus?.OK ?? "OK";
          service.getPlacePredictions(
            {
              input: input.trim(),
              componentRestrictions: { country: ["be"] },
              types: ["address"],
            },
            (preds, status) => {
              if (status !== OK || !preds?.length) {
                setPredictions([]);
              } else {
                setPredictions(preds.slice(0, MAX_RESULTS) as PlacePrediction[]);
              }
              setLoading(false);
            }
          );
        } catch {
          setPredictions([]);
          setLoading(false);
        }
      })();
    },
    [apiKey]
  );

  useEffect(() => {
    return () => {
      if (debounceRef.current != null) window.clearTimeout(debounceRef.current);
    };
  }, []);

  const scheduleFetch = (input: string) => {
    if (debounceRef.current != null) window.clearTimeout(debounceRef.current);
    if (input.trim().length < MIN_INPUT_LEN) {
      setPredictions([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    debounceRef.current = window.setTimeout(() => fetchPredictions(input), PREDICT_DEBOUNCE_MS);
  };

  const resolvePlace = (prediction: PlacePrediction) => {
    if (!apiKey) return;
    void (async () => {
      try {
        await loadGoogleMapsScript(apiKey);
        const g = window as unknown as { google?: GMaps };
        const google = g.google;
        if (!google?.maps?.places?.PlacesService) return;

        const dummy = document.createElement("div");
        const placesService = new google.maps.places.PlacesService(dummy);
        const OK = google.maps.places.PlacesServiceStatus?.OK ?? "OK";

        placesService.getDetails(
          { placeId: prediction.place_id, fields: ["formatted_address", "geometry", "name"] },
          (place, status) => {
            if (status !== OK || !place?.geometry?.location) return;
            const loc = place.geometry.location;
            const lat = loc.lat();
            const lng = loc.lng();
            const label =
              place.formatted_address?.trim() || place.name?.trim() || prediction.description;
            onPlaceSelect(label, { lat, lng });
            setOpen(false);
            setPredictions([]);
            setActiveIdx(-1);
            inputRef.current?.focus();
          }
        );
      } catch {
        /* ignore */
      }
    })();
  };

  const onKeyDown = (e: KeyboardEvent) => {
    if (!open || predictions.length === 0) {
      if (e.key === "Escape") setOpen(false);
      return;
    }
    if (e.key === "Escape") {
      setOpen(false);
      setActiveIdx(-1);
      e.preventDefault();
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((i) => (i + 1 >= predictions.length ? 0 : i + 1));
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => (i <= 0 ? predictions.length - 1 : i - 1));
      return;
    }
    if (e.key === "Enter" && activeIdx >= 0 && predictions[activeIdx]) {
      e.preventDefault();
      e.stopPropagation();
      resolvePlace(predictions[activeIdx]);
    }
  };

  const showList = open && predictions.length > 0 && Boolean(apiKey);

  const syncListBoxRect = useCallback(() => {
    const el = inputRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const gap = 6;
    const top = r.bottom + gap;
    const maxH = Math.max(120, Math.min(256, window.innerHeight - top - 12));
    setListBoxRect({ left: r.left, top, width: r.width, maxHeight: maxH });
  }, [inputRef]);

  useLayoutEffect(() => {
    if (!showList) {
      setListBoxRect(null);
      return;
    }
    syncListBoxRect();
    const onSync = () => syncListBoxRect();
    window.addEventListener("resize", onSync);
    document.addEventListener("scroll", onSync, true);
    return () => {
      window.removeEventListener("resize", onSync);
      document.removeEventListener("scroll", onSync, true);
    };
  }, [showList, syncListBoxRect, predictions]);

  const onInputChange = (next: string) => {
    setOpen(true);
    setActiveIdx(-1);
    scheduleFetch(next);
  };

  const onInputFocus = () => {
    setOpen(true);
    scheduleFetch(value === REQUESTER_GEOLOC_ADDRESS_PENDING ? "" : value);
  };

  const onInputBlur = () => {
    window.setTimeout(() => {
      setOpen(false);
      setActiveIdx(-1);
    }, 120);
  };

  return {
    apiKey,
    loading,
    predictions,
    activeIdx,
    setActiveIdx,
    listBoxRect,
    showList,
    onKeyDown,
    resolvePlace,
    onInputChange,
    onInputFocus,
    onInputBlur,
  };
}
