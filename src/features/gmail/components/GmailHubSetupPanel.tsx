"use client";

import { useTranslation } from "@/core/i18n/I18nContext";
import GmailGoogleConnectButton from "@/features/gmail/components/GmailGoogleConnectButton";
import { gmailShell } from "@/features/gmail/gmailHubUi";

type Props = {
  unauthorized: boolean;
  clientReady: boolean;
  expiredToken?: boolean;
  onConnect: () => void;
};

/** Écran déconnecté — bouton Google officiel uniquement. */
export default function GmailHubSetupPanel({
  unauthorized,
  clientReady,
  expiredToken,
  onConnect,
}: Props) {
  const { t } = useTranslation();

  return (
    <div
      data-testid="gmail-hub-setup"
      className={`${gmailShell} items-center justify-center px-8 py-10`}
    >
      {unauthorized ? (
        <p className="max-w-sm text-center text-[13px] text-slate-500">
          {t("gmail.hub.needs_login")}
        </p>
      ) : clientReady ? (
        <div className="flex flex-col items-center gap-3">
          {expiredToken ? (
            <p
              className="max-w-xs text-center text-[12px] text-amber-800/90"
              data-testid="gmail-hub-expired-token"
            >
              {t("gmail.hub.needs_refresh_token_short")}
            </p>
          ) : null}
          <GmailGoogleConnectButton onClick={onConnect} />
        </div>
      ) : (
        <p
          className="text-center text-[12px] text-amber-800/90"
          data-testid="gmail-hub-missing-client"
        >
          {t("gmail.hub.missing_google_client")}
        </p>
      )}
    </div>
  );
}
