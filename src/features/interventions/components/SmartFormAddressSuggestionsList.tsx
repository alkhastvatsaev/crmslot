"use client";

import { MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { LIST_PORTAL_Z_INDEX } from "@/features/interventions/hooks/smartFormAddressAutocompleteTypes";
import type {
  ListBoxRect,
  PlacePrediction,
} from "@/features/interventions/hooks/smartFormAddressAutocompleteTypes";

type Props = {
  listId: string;
  predictions: PlacePrediction[];
  activeIdx: number;
  listBoxRect: ListBoxRect;
  onHoverIndex: (index: number) => void;
  onSelect: (prediction: PlacePrediction) => void;
};

export default function SmartFormAddressSuggestionsList({
  listId,
  predictions,
  activeIdx,
  listBoxRect,
  onHoverIndex,
  onSelect,
}: Props) {
  return (
    <ul
      id={listId}
      data-testid="smart-form-address-suggestions"
      role="listbox"
      className="box-border max-h-64 overflow-auto rounded-[16px] border border-slate-200/80 bg-white/95 py-1.5 shadow-[0_24px_48px_-12px_rgba(15,23,42,0.22),0_0_0_1px_rgba(15,23,42,0.04)] backdrop-blur-md"
      style={{
        position: "fixed",
        left: listBoxRect.left,
        top: listBoxRect.top,
        width: listBoxRect.width,
        maxHeight: listBoxRect.maxHeight,
        zIndex: LIST_PORTAL_Z_INDEX,
      }}
    >
      {predictions.map((p, i) => {
        const main = p.structured_formatting?.main_text ?? p.description;
        const sub = p.structured_formatting?.secondary_text;
        const active = i === activeIdx;
        return (
          <li key={p.place_id} role="presentation">
            <button
              type="button"
              role="option"
              id={`${listId}-opt-${i}`}
              aria-selected={active}
              data-testid={`smart-form-address-prediction-${i}`}
              className={cn(
                "flex w-full items-start gap-2.5 px-3 py-2.5 text-left transition-colors",
                active ? "bg-slate-900/[0.06]" : "hover:bg-slate-50"
              )}
              onMouseDown={(e) => e.preventDefault()}
              onMouseEnter={() => onHoverIndex(i)}
              onClick={() => onSelect(p)}
            >
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" aria-hidden />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[15px] font-semibold leading-snug text-slate-900">
                  {main}
                </span>
                {sub ? (
                  <span className="mt-0.5 block truncate text-sm font-medium leading-snug text-slate-500">
                    {sub}
                  </span>
                ) : null}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
