import Link from "next/link";
import { PricingPlansGrid } from "@/features/subscriptions";

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-white font-[family-name:var(--font-outfit)]">
      <header className="border-b border-white/5 px-6 py-5">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4">
          <Link href="/landing" className="text-sm font-semibold text-slate-200 hover:text-white">
            CRMSLOT
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/landing" className="text-xs text-slate-400 hover:text-slate-200">
              Fonctionnalités
            </Link>
            <Link
              href="/"
              className="rounded-lg bg-white px-3 py-2 text-xs font-semibold text-slate-900"
            >
              Connexion
            </Link>
          </div>
        </div>
      </header>

      <section className="px-6 py-16">
        <div className="mx-auto max-w-5xl">
          <PricingPlansGrid />
        </div>
      </section>

      <section className="border-t border-white/5 px-6 py-12">
        <div className="mx-auto max-w-3xl text-center text-sm text-slate-400 space-y-3">
          <p>Essai gratuit 14 jours · Sans engagement · Facturation mensuelle Stripe</p>
          <p>Paiement sécurisé · TVA selon votre statut · Support e-mail inclus</p>
        </div>
      </section>

      <footer className="border-t border-white/5 px-6 py-8 text-center text-xs text-slate-600">
        CRMSLOT — Gestion d&apos;interventions terrain · Belgique
      </footer>
    </main>
  );
}
