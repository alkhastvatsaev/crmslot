"use client";

import { Loader2 } from "lucide-react";
import type { MultiFactorResolver } from "firebase/auth";
import { mfaHintKind } from "@/features/auth/clientPortalPasswordMfa";

type Props = {
  mfaResolver: MultiFactorResolver;
  mfaHintIndex: number;
  phoneVerificationId: string | null;
  mfaCode: string;
  setMfaCode: (value: string) => void;
  mfaBusy: boolean;
  onSendPhoneMfa: () => void | Promise<void>;
  onConfirmMfa: () => void | Promise<void>;
  onResetMfaUi: () => void;
};

export default function ClientPortalMfaPanel({
  mfaResolver,
  mfaHintIndex,
  phoneVerificationId,
  mfaCode,
  setMfaCode,
  mfaBusy,
  onSendPhoneMfa,
  onConfirmMfa,
  onResetMfaUi,
}: Props) {
  const hint = mfaResolver.hints[mfaHintIndex];
  if (!hint) return null;

  const hintKind = mfaHintKind(hint);

  return (
    <div
      data-testid="client-portal-mfa-panel"
      className="flex w-full flex-col gap-3 rounded-[18px] border border-indigo-200/80 bg-indigo-50/60 p-4"
    >
      <p className="text-[13px] font-bold text-indigo-950">
        Double authentification ({hintKind === "totp" ? "application" : "SMS"})
      </p>
      {hintKind === "phone" && (
        <button
          type="button"
          data-testid="client-portal-mfa-send-sms"
          disabled={mfaBusy || Boolean(phoneVerificationId)}
          onClick={() => void onSendPhoneMfa()}
          className="rounded-[12px] bg-white px-3 py-2.5 text-[13px] font-bold text-indigo-800 shadow-sm ring-1 ring-indigo-200/80 disabled:opacity-50"
        >
          {phoneVerificationId ? "SMS envoyé" : "Envoyer le code SMS"}
        </button>
      )}
      <label htmlFor="client-portal-mfa-code" className="sr-only">
        Code 2FA
      </label>
      <input
        id="client-portal-mfa-code"
        inputMode="numeric"
        autoComplete="one-time-code"
        value={mfaCode}
        onChange={(e) => setMfaCode(e.target.value)}
        placeholder={hintKind === "totp" ? "Code à 6 chiffres (authenticator)" : "Code SMS"}
        data-testid="client-portal-mfa-code"
        className="w-full rounded-[14px] border border-black/[0.06] bg-white px-4 py-3 text-[14px] font-mono font-semibold tracking-widest text-slate-900 outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/30"
      />
      <div className="flex gap-2">
        <button
          type="button"
          data-testid="client-portal-mfa-confirm"
          disabled={mfaBusy || !mfaCode.trim()}
          onClick={() => void onConfirmMfa()}
          className="flex-1 rounded-[12px] bg-indigo-600 py-2.5 text-[13px] font-bold text-white disabled:opacity-45"
        >
          {mfaBusy ? <Loader2 className="mx-auto h-4 w-4 animate-spin" /> : "Valider 2FA"}
        </button>
        <button
          type="button"
          data-testid="client-portal-mfa-cancel"
          disabled={mfaBusy}
          onClick={() => onResetMfaUi()}
          className="rounded-[12px] border border-black/[0.08] bg-white px-3 py-2.5 text-[13px] font-bold text-slate-700"
        >
          Annuler
        </button>
      </div>
    </div>
  );
}
