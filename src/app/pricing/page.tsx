import Link from "next/link";
import { PricingPageEffects, PricingPlansGrid } from "@/features/subscriptions";
import CrmslotLockMark from "@/features/subscriptions/components/CrmslotLockMark";

export default function PricingPage() {
  return (
    <main className="min-h-dvh overflow-y-auto bg-[radial-gradient(circle_at_top,#f8fafc_0,#fff_42%,#f8fafc_100%)] font-[family-name:var(--font-outfit)] text-slate-950">
      <PricingPageEffects />

      <header>
        <div className="mx-auto flex max-w-5xl justify-center px-4 py-4 sm:px-6">
          <Link href="/" aria-label="CRMSLOT" className="inline-flex shrink-0">
            <CrmslotLockMark className="h-12 w-10" />
          </Link>
        </div>
      </header>

      <section className="px-4 pb-6 pt-2 sm:px-6 sm:pb-10 sm:pt-4">
        <div className="mx-auto max-w-5xl rounded-[2rem] border border-slate-200/80 bg-white/80 p-4 shadow-[0_30px_90px_-60px_rgba(2,6,23,0.55)] backdrop-blur sm:p-8">
          <PricingPlansGrid />
        </div>
      </section>
    </main>
  );
}
