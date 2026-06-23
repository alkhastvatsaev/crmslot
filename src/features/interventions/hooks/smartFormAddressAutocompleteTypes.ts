export const PREDICT_DEBOUNCE_MS = 220;
export const LIST_PORTAL_Z_INDEX = 200;
export const MIN_INPUT_LEN = 2;
export const MAX_RESULTS = 6;

export type PlacePrediction = {
  place_id: string;
  description: string;
  structured_formatting?: {
    main_text: string;
    secondary_text?: string;
  };
};

export type ListBoxRect = {
  left: number;
  top: number;
  width: number;
  maxHeight: number;
};

export type GMaps = {
  maps: {
    places: {
      AutocompleteService: new () => {
        getPlacePredictions: (
          request: {
            input: string;
            componentRestrictions: { country: string | string[] };
            types?: string[];
          },
          callback: (predictions: PlacePrediction[] | null, status: string) => void
        ) => void;
      };
      PlacesService: new (attr: HTMLElement) => {
        getDetails: (
          request: { placeId: string; fields: string[] },
          callback: (
            place: {
              formatted_address?: string;
              name?: string;
              geometry?: { location?: { lat(): number; lng(): number } };
            } | null,
            status: string
          ) => void
        ) => void;
      };
      PlacesServiceStatus: { OK: string };
    };
  };
};
