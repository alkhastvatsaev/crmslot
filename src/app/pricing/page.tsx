import Link from "next/link";
import {
  isSubscriptionPlanId,
  PricingFaq,
  PricingPageEffects,
  PricingPlansGrid,
} from "@/features/subscriptions";
import type { SubscriptionPlanId } from "@/features/subscriptions/subscriptionTypes";

type Props = {
  searchParams: Promise<{ plan?: string }>;
};

export default async function PricingPage({ searchParams }: Props) {
  const params = await searchParams;
  const rawPlan = params.plan?.trim();
  const defaultPlanId: SubscriptionPlanId | undefined =
    rawPlan && isSubscriptionPlanId(rawPlan) ? rawPlan : undefined;

  return (
    <main className="min-h-dvh bg-white font-[family-name:var(--font-outfit)] text-slate-900">
      <PricingPageEffects />

      <header className="border-b border-slate-100">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">
          <Link href="/landing" className="text-[15px] font-semibold tracking-tight text-slate-900">
            CRMSLOT
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/landing"
              className="hidden text-[13px] font-medium text-slate-500 transition hover:text-slate-900 sm:inline"
            >
              Fonctionnalités
            </Link>
            <Link
              href="/"
              className="rounded-lg border border-slate-200 px-3.5 py-2 text-[13px] font-semibold text-slate-800 transition hover:bg-slate-50"
            >
              Connexion
            </Link>
          </div>
        </div>
      </header>

      <section className="px-6 py-14 sm:py-20">
        <div className="mx-auto max-w-6xl">
          <PricingPlansGrid defaultPlanId={defaultPlanId} />
        </div>
      </section>

      <section className="border-t border-slate-100 bg-slate-50/80 px-6 py-16">
        <PricingFaq />
      </section>

      <section className="border-t border-slate-100 px-6 py-10">
        <div className="mx-auto max-w-2xl space-y-2 text-center text-[13px] text-slate-500">
          <p>Essai gratuit 14 jours · Sans engagement · Facturation mensuelle Stripe</p>
          <p>Paiement sécurisé · TVA selon votre statut · Support e-mail inclus</p>
        </div>
      </section>

      <footer className="border-t border-slate-100 px-6 py-8 text-center text-[12px] text-slate-400">
        CRMSLOT — Gestion d&apos;interventions terrain · Belgique
      </footer>
    </main>
  );
}
