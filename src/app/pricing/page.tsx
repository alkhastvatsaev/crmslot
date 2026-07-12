import Image from "next/image";
import Link from "next/link";
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
          <Link href="/" aria-label="CRMSLOT" className="inline-flex shrink-0">
            <Image
              src="/pwa/crmslot-lock-mark.svg"
              alt=""
              width={34}
              height={42}
              priority
              className="h-[42px] w-[34px]"
            />
          </Link>
          <Link
            href="/"
            className="rounded-xl border border-slate-200 bg-white/70 px-3.5 py-2 text-[13px] font-semibold text-slate-800 shadow-sm backdrop-blur transition hover:bg-white"
          >
            Connexion
          </Link>
        </div>
      </header>

      <section className="px-4 pb-6 pt-2 sm:px-6 sm:pb-10 sm:pt-4">
        <div className="mx-auto max-w-5xl rounded-[2rem] border border-slate-200/80 bg-white/80 p-4 shadow-[0_30px_90px_-60px_rgba(2,6,23,0.55)] backdrop-blur sm:p-8">
          <PricingPlansGrid defaultPlanId={defaultPlanId} />
        </div>
      </section>
    </main>
  );
}
