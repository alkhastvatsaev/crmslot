"use client";

import { forwardRef, useId, useRef } from "react";
import { createPortal } from "react-dom";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import SmartFormAddressSuggestionsList from "@/features/interventions/components/SmartFormAddressSuggestionsList";
import {
  assignSmartFormAddressInputRef,
  useSmartFormAddressAutocomplete,
} from "@/features/interventions/hooks/useSmartFormAddressAutocomplete";
import { REQUESTER_GEOLOC_ADDRESS_PENDING } from "@/features/interventions/smartInterventionConstants";
import { useTranslation } from "@/core/i18n/I18nContext";

type Props = {
  value: string;
  onValueChange: (next: string) => void;
  onPlaceSelect: (formattedAddress: string, latLng: { lat: number; lng: number }) => void;
  disabled?: boolean;
  className?: string;
};

const SmartFormAddressAutocomplete = forwardRef<HTMLInputElement, Props>(
  function SmartFormAddressAutocomplete(
    { value, onValueChange, onPlaceSelect, disabled, className },
    ref
  ) {
    const { t } = useTranslation();
    const listId = useId();
    const inputRef = useRef<HTMLInputElement | null>(null);

    const {
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
    } = useSmartFormAddressAutocomplete({ value, onPlaceSelect, inputRef });

    const displayValue =
      value === REQUESTER_GEOLOC_ADDRESS_PENDING
        ? String(t("requester.intervention.geoloc_pending"))
        : value;

    const suggestionList =
      showList && listBoxRect ? (
        <SmartFormAddressSuggestionsList
          listId={listId}
          predictions={predictions}
          activeIdx={activeIdx}
          listBoxRect={listBoxRect}
          onHoverIndex={setActiveIdx}
          onSelect={resolvePlace}
        />
      ) : null;

    return (
      <div className={cn("relative w-full", className)}>
        <input
          ref={(node) => assignSmartFormAddressInputRef(node, inputRef, ref)}
          data-testid="smart-form-address"
          value={displayValue}
          disabled={disabled}
          onChange={(e) => {
            onValueChange(e.target.value);
            onInputChange(e.target.value);
          }}
          onFocus={onInputFocus}
          onBlur={onInputBlur}
          onKeyDown={onKeyDown}
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={showList}
          aria-controls={showList ? listId : undefined}
          aria-activedescendant={activeIdx >= 0 ? `${listId}-opt-${activeIdx}` : undefined}
          placeholder={t("smart_form.address_placeholder")}
          autoComplete="off"
          className="w-full rounded-[14px] border border-black/[0.06] bg-white/95 py-3 pl-3 pr-12 text-base font-semibold text-slate-900 outline-none placeholder:text-slate-400 placeholder:font-medium focus-visible:ring-2 focus-visible:ring-slate-900/15 disabled:opacity-50"
        />

        {apiKey && loading ? (
          <span
            className="pointer-events-none absolute right-14 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center text-slate-400"
            aria-hidden
          >
            <Loader2 className="h-4 w-4 animate-spin" />
          </span>
        ) : null}

        {typeof document !== "undefined" && suggestionList
          ? createPortal(suggestionList, document.body)
          : null}
      </div>
    );
  }
);

SmartFormAddressAutocomplete.displayName = "SmartFormAddressAutocomplete";

export default SmartFormAddressAutocomplete;
