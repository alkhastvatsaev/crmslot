import Link from "next/link";
import { PricingPlansGrid } from "@/features/subscriptions";

export default function PricingPage() {
  return (
    <main className="min-h-dvh bg-gradient-to-br from-slate-50 via-white to-blue-50 font-[family-name:var(--font-outfit)]">
      <header className="flex items-center justify-between px-6 py-5">
        <Link href="/" className="text-[13px] font-semibold tracking-tight text-slate-800">
          CRMSLOT
        </Link>
        <Link
          href="/"
          className="text-[13px] font-medium text-slate-500 transition hover:text-slate-800"
        >
          Connexion
        </Link>
      </header>

      <section className="flex flex-1 flex-col items-center justify-center px-6 pb-16 pt-4">
        <PricingPlansGrid />
      </section>
    </main>
  );
}
