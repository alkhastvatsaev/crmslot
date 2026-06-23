"use client";

import { useTranslation } from "@/core/i18n/I18nContext";
import { HubSegmentedControl } from "@/core/ui/hub";
import ClientPortalAuthForm from "@/features/auth/components/ClientPortalAuthForm";
import ClientPortalMfaPanel from "@/features/auth/components/ClientPortalMfaPanel";
import type { ClientPortalAuthTab } from "@/features/auth/hooks/useClientPortalAuth";
import type { MultiFactorResolver } from "firebase/auth";

type Props = {
  authTab: ClientPortalAuthTab;
  setAuthTab: (tab: ClientPortalAuthTab) => void;
  email: string;
  setEmail: (value: string) => void;
  password: string;
  setPassword: (value: string) => void;
  confirmPassword: string;
  setConfirmPassword: (value: string) => void;
  emailAuthBusy: boolean;
  googleBusy: boolean;
  mfaResolver: MultiFactorResolver | null;
  mfaHintIndex: number;
  phoneVerificationId: string | null;
  mfaCode: string;
  setMfaCode: (value: string) => void;
  mfaBusy: boolean;
  onEmailPasswordSubmit: () => void | Promise<void>;
  onGoogleSignIn: () => void | Promise<void>;
  onSendPhoneMfa: () => void | Promise<void>;
  onConfirmMfa: () => void | Promise<void>;
  onResetMfaUi: () => void;
};

export default function ClientPortalAuthCard({
  authTab,
  setAuthTab,
  email,
  setEmail,
  password,
  setPassword,
  confirmPassword,
  setConfirmPassword,
  emailAuthBusy,
  googleBusy,
  mfaResolver,
  mfaHintIndex,
  phoneVerificationId,
  mfaCode,
  setMfaCode,
  mfaBusy,
  onEmailPasswordSubmit,
  onGoogleSignIn,
  onSendPhoneMfa,
  onConfirmMfa,
  onResetMfaUi,
}: Props) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col items-center gap-5 rounded-[24px] border border-black/[0.06] bg-gradient-to-b from-white/96 via-white/90 to-slate-50/85 px-6 py-8 shadow-[0_20px_50px_-24px_rgba(15,23,42,0.12)] backdrop-blur-xl">
      <div className="w-full text-center">
        <h3 className="text-[18px] font-extrabold text-slate-800">
          {t("auth.client_space_title")}
        </h3>
      </div>

      <HubSegmentedControl
        value={authTab}
        onChange={(id) => setAuthTab(id as ClientPortalAuthTab)}
        size="compact"
        className="w-full shrink-0"
        options={[
          {
            id: "login",
            label: t("auth.login_tab"),
            testId: "client-portal-tab-login",
            activeAccent: "slate",
          },
          {
            id: "register",
            label: t("auth.register_tab"),
            testId: "client-portal-tab-register",
            activeAccent: "slate",
          },
        ]}
      />

      <ClientPortalAuthForm
        authTab={authTab}
        email={email}
        setEmail={setEmail}
        password={password}
        setPassword={setPassword}
        confirmPassword={confirmPassword}
        setConfirmPassword={setConfirmPassword}
        emailAuthBusy={emailAuthBusy}
        googleBusy={googleBusy}
        onEmailPasswordSubmit={onEmailPasswordSubmit}
        onGoogleSignIn={onGoogleSignIn}
      />

      {mfaResolver && mfaResolver.hints[mfaHintIndex] ? (
        <ClientPortalMfaPanel
          mfaResolver={mfaResolver}
          mfaHintIndex={mfaHintIndex}
          phoneVerificationId={phoneVerificationId}
          mfaCode={mfaCode}
          setMfaCode={setMfaCode}
          mfaBusy={mfaBusy}
          onSendPhoneMfa={onSendPhoneMfa}
          onConfirmMfa={onConfirmMfa}
          onResetMfaUi={onResetMfaUi}
        />
      ) : null}
    </div>
  );
}
