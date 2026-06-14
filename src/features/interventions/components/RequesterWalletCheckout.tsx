"use client";

import { useMemo, useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, ExpressCheckoutElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { toast } from "sonner";
import { useTranslation } from "@/core/i18n/I18nContext";

type WalletCheckoutInnerProps = {
  interventionId: string;
  onCardFallbackVisibleChange?: (visible: boolean) => void;
};

function WalletCheckoutInner({
  interventionId,
  onCardFallbackVisibleChange,
}: WalletCheckoutInnerProps) {
  const { t } = useTranslation();
  const stripe = useStripe();
  const elements = useElements();
  const [ready, setReady] = useState(false);

  return (
    <div
      data-testid="requester-wallet-checkout"
      className={ready ? "block w-full" : "hidden w-full"}
      aria-hidden={!ready}
    >
      <ExpressCheckoutElement
        options={{
          buttonHeight: 44,
          paymentMethods: {
            applePay: "always",
            googlePay: "always",
            link: "never",
            paypal: "never",
            amazonPay: "never",
          },
        }}
        onReady={({ availablePaymentMethods }) => {
          const hasWallet = Boolean(
            availablePaymentMethods?.applePay || availablePaymentMethods?.googlePay
          );
          setReady(hasWallet);
          onCardFallbackVisibleChange?.(!hasWallet);
        }}
        onConfirm={async () => {
          if (!stripe || !elements) return;
          const returnUrl = `${window.location.origin}/?payment=success&interventionId=${encodeURIComponent(interventionId)}`;
          const { error } = await stripe.confirmPayment({
            elements,
            confirmParams: { return_url: returnUrl },
          });
          if (error) {
            toast.error(String(t("payment.error")), { description: error.message });
          }
        }}
      />
    </div>
  );
}

type Props = {
  interventionId: string;
  clientSecret: string;
  publishableKey: string;
  onCardFallbackVisibleChange?: (visible: boolean) => void;
};

export default function RequesterWalletCheckout({
  interventionId,
  clientSecret,
  publishableKey,
  onCardFallbackVisibleChange,
}: Props) {
  const stripePromise = useMemo(() => loadStripe(publishableKey), [publishableKey]);

  return (
    <Elements
      stripe={stripePromise}
      options={{
        clientSecret,
        appearance: {
          theme: "stripe",
          variables: {
            borderRadius: "12px",
          },
        },
      }}
    >
      <WalletCheckoutInner
        interventionId={interventionId}
        onCardFallbackVisibleChange={onCardFallbackVisibleChange}
      />
    </Elements>
  );
}
