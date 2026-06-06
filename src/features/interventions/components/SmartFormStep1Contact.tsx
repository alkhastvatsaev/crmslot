"use client";

import React from "react";
import { Loader2, MapPin } from "lucide-react";
import SmartFormAddressAutocomplete from "@/features/interventions/components/SmartFormAddressAutocomplete";
import SmartFormAddressMiniMap from "@/features/interventions/components/SmartFormAddressMiniMap";

const SMART_FORM_CONTACT_INPUT_CLASS =
  "w-full rounded-[14px] border border-black/[0.06] bg-white/95 px-3 py-2.5 text-sm font-semibold text-slate-900 outline-none placeholder:text-slate-400 placeholder:font-medium focus-visible:ring-2 focus-visible:ring-slate-900/15";

const SMART_FORM_CONTACT_LABEL_CLASS =
  "mb-1 block text-[11px] font-bold uppercase tracking-[0.06em] text-slate-500";

type Props = {
  firstName: string;
  setFirstName: (v: string) => void;
  lastName: string;
  setLastName: (v: string) => void;
  phone: string;
  setPhone: (v: string) => void;
  address: string;
  setAddress: (v: string) => void;
  placeLatLng: { lat: number; lng: number } | undefined;
  setPlaceLatLng: (v: { lat: number; lng: number } | undefined) => void;
  locatingAddress: boolean;
  addressInputRef: React.RefObject<HTMLInputElement | null>;
  onGeolocate: () => void;
  canContinueAddress: boolean;
  onContinue: () => void;
};

export default function SmartFormStep1Contact({
  firstName,
  setFirstName,
  lastName,
  setLastName,
  phone,
  setPhone,
  address,
  setAddress,
  placeLatLng,
  setPlaceLatLng,
  locatingAddress,
  addressInputRef,
  onGeolocate,
  canContinueAddress,
  onContinue,
}: Props) {
  return (
    <div className="flex flex-col gap-3" role="region" aria-label="Étape 1 — Coordonnées & Adresse">
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label htmlFor="smart-form-first-name" className={SMART_FORM_CONTACT_LABEL_CLASS}>
            Prénom
          </label>
          <input
            id="smart-form-first-name"
            data-testid="smart-form-first-name"
            type="text"
            autoComplete="given-name"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            className={SMART_FORM_CONTACT_INPUT_CLASS}
            placeholder="Tony"
          />
        </div>
        <div>
          <label htmlFor="smart-form-last-name" className={SMART_FORM_CONTACT_LABEL_CLASS}>
            Nom
          </label>
          <input
            id="smart-form-last-name"
            data-testid="smart-form-last-name"
            type="text"
            autoComplete="family-name"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            className={SMART_FORM_CONTACT_INPUT_CLASS}
            placeholder="Stark"
          />
        </div>
      </div>

      <div>
        <label htmlFor="smart-form-phone" className={SMART_FORM_CONTACT_LABEL_CLASS}>
          Numéro de téléphone
        </label>
        <input
          id="smart-form-phone"
          data-testid="smart-form-phone"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className={SMART_FORM_CONTACT_INPUT_CLASS}
          placeholder="+33 6 12 34 56 78"
        />
      </div>

      <div className="mt-2 h-px w-full bg-slate-200" aria-hidden />

      <div className="relative">
        <label className="block">
          <span className="sr-only">Adresse d&apos;intervention</span>
          <SmartFormAddressAutocomplete
            ref={addressInputRef}
            value={address}
            onValueChange={(next) => {
              setAddress(next);
              setPlaceLatLng(undefined);
            }}
            onPlaceSelect={(formatted, latLng) => {
              setAddress(formatted);
              setPlaceLatLng(latLng);
            }}
            disabled={locatingAddress}
          />
        </label>
        <button
          type="button"
          data-testid="smart-form-locate"
          disabled={locatingAddress}
          aria-label="Renseigner l'adresse à partir de ma position sur la carte"
          onClick={onGeolocate}
          className="absolute right-1.5 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-100/90 hover:text-slate-700 disabled:opacity-45"
        >
          {locatingAddress ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          ) : (
            <MapPin className="h-4 w-4" aria-hidden />
          )}
        </button>
      </div>

      <SmartFormAddressMiniMap address={address} placeLatLng={placeLatLng} />

      <button
        type="button"
        data-testid="smart-form-continue-address"
        disabled={!canContinueAddress}
        onClick={onContinue}
        className="min-h-[48px] w-full rounded-[14px] bg-slate-900 px-4 text-sm font-bold text-white shadow-lg transition hover:bg-slate-800 disabled:opacity-40"
      >
        Continuer
      </button>

      {!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ? (
        <span className="sr-only">Autocomplete Places indisponible sans clé Google Maps</span>
      ) : null}
    </div>
  );
}
