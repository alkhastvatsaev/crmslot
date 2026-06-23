"use client";

import ClientPortalAuthForm from "@/features/auth/components/ClientPortalAuthForm";
import ClientPortalMfaPanel from "@/features/auth/components/ClientPortalMfaPanel";
import type { ClientPortalAuthTab } from "@/features/auth/hooks/useClientPortalAuth";
import type { MultiFactorResolver } from "firebase/auth";

type Props = {
  authTab: ClientPortalAuthTab;
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

export default function ClientPortalAuthRailContent(props: Props) {
  const { mfaResolver, mfaHintIndex, ...formProps } = props;

  return (
    <div className="flex w-full flex-col gap-4">
      <ClientPortalAuthForm {...formProps} />
      {mfaResolver && mfaResolver.hints[mfaHintIndex] ? (
        <ClientPortalMfaPanel
          mfaResolver={mfaResolver}
          mfaHintIndex={mfaHintIndex}
          phoneVerificationId={props.phoneVerificationId}
          mfaCode={props.mfaCode}
          setMfaCode={props.setMfaCode}
          mfaBusy={props.mfaBusy}
          onSendPhoneMfa={props.onSendPhoneMfa}
          onConfirmMfa={props.onConfirmMfa}
          onResetMfaUi={props.onResetMfaUi}
        />
      ) : null}
    </div>
  );
}
