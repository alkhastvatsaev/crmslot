"use client";

import { useCallback, useEffect, useState } from "react";
import { CreditCard, CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { fetchWithAuth } from "@/core/api/fetchWithAuth";
import { useTranslation } from "@/core/i18n/I18nContext";
import RequesterWalletCheckout from "@/features/interventions/components/RequesterWalletCheckout";

type Props = {
  interventionId: string;
  paymentStatus?: string | null;
  invoiceAmountCents?: number | null;
  stripePaymentLinkUrl?: string | null;
  compact?: boolean;
  premium?: boolean;
  unified?: boolean;
};

type PaymentIntentResponse = {
  clientSecret?: string | null;
  publishableKey?: string | null;
  mock?: boolean;
  error?: string;
};

export default function RequesterPaymentPanel({
  interventionId,
  paymentStatus,
  invoiceAmountCents,
  stripePaymentLinkUrl,
  compact = false,
  premium = false,
  unified = false,
}: Props) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [walletClientSecret, setWalletClientSecret] = useState<string | null>(null);
  const [walletPublishableKey, setWalletPublishableKey] = useState<string | null>(null);
  const [walletLoading, setWalletLoading] = useState(false);
  const [showCardFallback, setShowCardFallback] = useState(false);

  const amountLabel =
    typeof invoiceAmountCents === "number" && invoiceAmountCents > 0
      ? `${(invoiceAmountCents / 100).toFixed(2)} €`
      : null;

  const useWalletCheckout = compact && premium && unified && paymentStatus !== "paid";

  useEffect(() => {
    if (!useWalletCheckout || !amountLabel) return;
    let cancelled = false;

    (async () => {
      setWalletLoading(true);
      try {
        const res = await fetchWithAuth("/api/stripe/create-payment-intent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ interventionId }),
        });
        const data = (await res.json()) as PaymentIntentResponse;
        if (cancelled) return;
        if (!res.ok) {
          setShowCardFallback(true);
          return;
        }
        if (data.clientSecret && data.publishableKey) {
          setWalletClientSecret(data.clientSecret);
          setWalletPublishableKey(data.publishableKey);
        } else {
          setShowCardFallback(true);
        }
      } catch {
        if (!cancelled) setShowCardFallback(true);
      } finally {
        if (!cancelled) setWalletLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [useWalletCheckout, amountLabel, interventionId]);

  const openCardPayment = useCallback(async () => {
    if (stripePaymentLinkUrl) {
      window.open(stripePaymentLinkUrl, "_blank", "noopener,noreferrer");
      return;
    }
    setLoading(true);
    try {
      const res = await fetchWithAuth("/api/stripe/create-payment-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ interventionId }),
      });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !data.url) {
        throw new Error(data.error ?? "Paiement indisponible");
      }
      window.open(data.url, "_blank", "noopener,noreferrer");
    } catch (err) {
      toast.error(String(t("payment.error")), {
        description: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setLoading(false);
    }
  }, [interventionId, stripePaymentLinkUrl, t]);

  if (paymentStatus === "paid") {
    return (
      <div
        data-testid="requester-payment-paid"
        className={
          compact && premium && unified
            ? "text-[13px] font-medium text-slate-500"
            : compact && premium
              ? "flex w-full items-center justify-center rounded-2xl bg-slate-50 px-4 py-3 text-[13px] font-medium text-slate-600 ring-1 ring-black/[0.04]"
              : compact
                ? "inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-bold text-emerald-800"
                : "mt-4 inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-bold text-emerald-800"
        }
      >
        <CheckCircle2
          className={
            compact && premium && !unified
              ? "mr-1.5 h-4 w-4 text-slate-500"
              : compact && premium && unified
                ? "hidden"
                : "h-4 w-4"
          }
        />
        {t("payment.status_paid")}
      </div>
    );
  }

  if (compact && premium && unified) {
    return (
      <div
        data-testid="requester-payment-panel"
        className="flex w-full flex-col items-stretch gap-2"
      >
        {walletLoading ? (
          <div className="flex h-11 items-center justify-center text-slate-400">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          </div>
        ) : null}
        {walletClientSecret && walletPublishableKey ? (
          <RequesterWalletCheckout
            interventionId={interventionId}
            clientSecret={walletClientSecret}
            publishableKey={walletPublishableKey}
            onCardFallbackVisibleChange={setShowCardFallback}
          />
        ) : null}
        {showCardFallback ? (
          <button
            type="button"
            data-testid="requester-pay-card-fallback"
            disabled={loading}
            onClick={() => void openCardPayment()}
            className="text-[13px] font-medium text-slate-600 underline-offset-4 transition-colors hover:text-slate-900 hover:underline disabled:opacity-60"
          >
            {loading
              ? t("payment.loading")
              : amountLabel
                ? `${t("payment.pay_by_card")} · ${amountLabel}`
                : t("payment.pay_by_card")}
          </button>
        ) : null}
      </div>
    );
  }

  if (compact) {
    return (
      <button
        type="button"
        data-testid="requester-payment-panel"
        disabled={loading}
        onClick={() => void openCardPayment()}
        className={
          premium
            ? "flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-[13px] font-medium text-white transition hover:bg-slate-800 disabled:opacity-60"
            : "inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-black px-3 py-2 text-[11px] font-bold text-white transition hover:bg-black/85 disabled:opacity-60"
        }
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : premium ? null : (
          <CreditCard className="h-3.5 w-3.5" />
        )}
        {amountLabel ? `${t("payment.pay_now")} · ${amountLabel}` : t("payment.pay_now")}
      </button>
    );
  }

  return (
    <div className="mt-4 flex flex-col items-center gap-2" data-testid="requester-payment-panel">
      {amountLabel ? (
        <p className="text-[13px] font-medium text-slate-600">
          {t("payment.amount_due")}: <span className="font-bold text-black">{amountLabel}</span>
        </p>
      ) : null}
      <button
        type="button"
        data-testid="requester-pay-button"
        disabled={loading}
        onClick={() => void openCardPayment()}
        className="inline-flex items-center gap-2 rounded-xl bg-black px-5 py-2.5 text-sm font-bold text-white transition hover:bg-black/85 disabled:opacity-60"
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <CreditCard className="h-4 w-4" />
        )}
        {loading ? t("payment.loading") : t("payment.pay_now")}
      </button>
      {paymentStatus === "pending" ? (
        <p className="text-[11px] text-slate-500">{t("payment.pending_hint")}</p>
      ) : null}
    </div>
  );
}
