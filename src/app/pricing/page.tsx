import Link from "next/link";
import { LockKeyhole, Sparkles } from "lucide-react";
import {
  isSubscriptionPlanId,
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
    <main className="min-h-dvh bg-[radial-gradient(circle_at_top,#f8fafc_0,#fff_42%,#f8fafc_100%)] font-[family-name:var(--font-outfit)] text-slate-950">
      <PricingPageEffects />

      <header>
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <Link
            href="/"
            aria-label="CRMSLOT"
            className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-black via-slate-900 to-slate-600 text-white shadow-[0_16px_40px_-22px_rgba(2,6,23,0.9)]"
          >
            <LockKeyhole className="h-5 w-5" aria-hidden />
          </Link>
          <Link
            href="/"
            className="rounded-xl border border-slate-200 bg-white/70 px-3.5 py-2 text-[13px] font-semibold text-slate-800 shadow-sm backdrop-blur transition hover:bg-white"
          >
            Connexion
          </Link>
        </div>
      </header>

      <section className="px-4 pb-6 pt-4 sm:px-6 sm:pb-10 sm:pt-8">
        <div className="mx-auto max-w-5xl rounded-[2rem] border border-slate-200/80 bg-white/80 p-4 shadow-[0_30px_90px_-60px_rgba(2,6,23,0.55)] backdrop-blur sm:p-8">
          <div className="mb-5 flex items-center justify-center gap-2 text-[12px] font-medium text-slate-500">
            <Sparkles className="h-3.5 w-3.5" aria-hidden />
            <span>Tarif simple. Un prix par technicien.</span>
          </div>
          <PricingPlansGrid defaultPlanId={defaultPlanId} />
        </div>
      </section>
    </main>
  );
}
