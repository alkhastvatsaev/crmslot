"use client";

import type { KeyboardEvent } from "react";
import { Loader2, MapPin, SendHorizontal } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "@/core/i18n/I18nContext";
import SmartFormAddressAutocomplete from "@/features/interventions/components/SmartFormAddressAutocomplete";
import SmartFormAddressMiniMap from "@/features/interventions/components/SmartFormAddressMiniMap";
import RequesterSubmittedDossierBanner from "@/features/interventions/components/RequesterSubmittedDossierBanner";

type LatLng = { lat: number; lng: number };

type Props = {
  showSubmitSuccess: boolean;
  dossierNumber: string | null;
  interventionAddress: string;
  interventionLatLng: LatLng | null;
  locatingAddress: boolean;
  canSubmit: boolean;
  isSubmitting: boolean;
  addressConfirmed: boolean;
  hasValidAddress: boolean;
  onAddressChange: (value: string) => void;
  onPlaceSelect: (formatted: string, loc: LatLng) => void;
  onLocate: () => void;
  onConfirmAddress: () => void;
  onSubmit: () => void;
  onKeyDown?: (e: KeyboardEvent) => void;
};

export default function RequesterStepAddressSubmit({
  showSubmitSuccess,
  dossierNumber,
  interventionAddress,
  interventionLatLng,
  locatingAddress,
  canSubmit,
  isSubmitting,
  addressConfirmed,
  hasValidAddress,
  onAddressChange,
  onPlaceSelect,
  onLocate,
  onConfirmAddress,
  onSubmit,
  onKeyDown,
}: Props) {
  const { t } = useTranslation();

  if (showSubmitSuccess && dossierNumber) {
    return (
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-4 px-2">
        <RequesterSubmittedDossierBanner dossierNumber={dossierNumber} />
      </div>
    );
  }

  const needsAddressConfirm = hasValidAddress && !addressConfirmed;
  const submitDisabled = !canSubmit || needsAddressConfirm;

  return (
    <div className="flex min-h-0 flex-1 flex-col justify-between gap-3" onKeyDown={onKeyDown}>
      <div className="flex min-h-0 flex-1 flex-col gap-1 rounded-[24px] border border-black/5 bg-white p-3 shadow-sm">
        <div className="flex shrink-0 items-center gap-2">
          <div className="relative flex-1">
            <SmartFormAddressAutocomplete
              value={interventionAddress}
              onValueChange={onAddressChange}
              onPlaceSelect={onPlaceSelect}
              disabled={locatingAddress}
            />
          </div>
          <button
            type="button"
            onClick={onLocate}
            disabled={locatingAddress}
            aria-label={String(t("requester.intervention.locate_aria"))}
            className="flex h-[48px] w-[48px] shrink-0 items-center justify-center rounded-[14px] bg-slate-100 transition-colors hover:bg-slate-200 disabled:opacity-50"
          >
            {locatingAddress ? (
              <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
            ) : (
              <MapPin className="h-4 w-4 text-slate-800" />
            )}
          </button>
        </div>

        <div className="relative min-h-0 flex-1 overflow-hidden rounded-[16px]">
          <SmartFormAddressMiniMap
            address={interventionAddress}
            placeLatLng={interventionLatLng ?? undefined}
            className="h-full min-h-[140px] w-full !border-none"
          />
          <div className="pointer-events-none absolute inset-0 rounded-[16px] shadow-[inset_0_0_0_1px_rgba(0,0,0,0.05)]" />
          {needsAddressConfirm ? (
            <div
              data-testid="requester-address-confirm"
              className="absolute inset-x-2 bottom-2 rounded-[14px] border border-white/80 bg-white/95 p-3 shadow-lg backdrop-blur-sm"
            >
              <p className="text-center text-[13px] font-semibold text-slate-900">
                {String(t("requester.ux.address_confirm_title"))}
              </p>
              <div className="mt-2.5 flex gap-2">
                <button
                  type="button"
                  data-testid="requester-address-confirm-yes"
                  onClick={onConfirmAddress}
                  className="min-h-[48px] flex-1 rounded-[12px] bg-black px-3 py-3 text-[13px] font-bold text-white transition hover:bg-slate-900"
                >
                  {String(t("requester.ux.address_confirm_yes"))}
                </button>
                <button
                  type="button"
                  data-testid="requester-address-confirm-edit"
                  onClick={() => onAddressChange(interventionAddress)}
                  className="min-h-[48px] flex-1 rounded-[12px] border border-slate-200 bg-white px-3 py-3 text-[13px] font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  {String(t("requester.ux.address_confirm_edit"))}
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <div className="shrink-0 pb-1">
        <button
          type="button"
          data-testid="intervention-submit-btn"
          disabled={submitDisabled}
          onClick={() => {
            if (needsAddressConfirm) {
              toast.message(String(t("requester.ux.address_confirm_required")));
              return;
            }
            onSubmit();
          }}
          className="mx-auto flex w-full max-w-none min-h-[52px] items-center justify-center gap-2 rounded-[16px] bg-black px-8 py-5 text-lg font-bold text-white transition hover:bg-slate-900 active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100"
        >
          {isSubmitting ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <>
              <SendHorizontal className="h-5 w-5" />
              {String(t("requester.intervention.submit_request"))}
            </>
          )}
        </button>
      </div>
    </div>
  );
}
