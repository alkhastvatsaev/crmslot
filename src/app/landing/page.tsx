import Link from "next/link";

const features = [
  {
    icon: "⚡",
    title: "Workflow d'intervention",
    items: ["Statuts clairs", "Suivi des changements", "Responsable identifié"],
  },
  {
    icon: "📅",
    title: "Planning intelligent",
    items: ["Planification techniciens", "Zéro conflit", "Auto-population"],
  },
  {
    icon: "📧",
    title: "Email + Matériaux",
    items: ["Emails intégrés", "Commande matériaux", "Lié au dossier"],
  },
  {
    icon: "💬",
    title: "Communication centralisée",
    items: ["Historique unifié", "Tous les commentaires", "Accès rapide"],
  },
  {
    icon: "📷",
    title: "Photos terrain",
    items: ["Upload rapide", "Preuve du travail", "Photos équipement"],
  },
  {
    icon: "🏠",
    title: "Portail client",
    items: ["Statut temps réel", "Historique interventions", "Communication client"],
  },
];

const painPoints = [
  "Outils séparés et non connectés",
  "Perte d'historique entre interventions",
  "Visites terrain non maîtrisées",
];

const roadmap = [
  "Workflow et statuts",
  "Notifications temps réel",
  "Moteur de planning",
  "Module email",
  "Module approvisionnement",
  "Historique complet",
  "Upload photos",
  "Portail client",
  "Module facturation",
  "Dashboard rapide",
];

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-white font-[family-name:var(--font-outfit)]">
      {/* Hero */}
      <section className="relative flex flex-col items-center justify-center px-6 pt-28 pb-24 text-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-950/40 via-slate-950 to-emerald-950/30 pointer-events-none" />
        <div className="relative z-10 max-w-3xl">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-medium text-slate-300 backdrop-blur-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            CRM · Field Services · Ordres de travail
          </div>
          <h1 className="mb-6 text-5xl font-bold leading-tight tracking-tight text-white md:text-6xl">
            Gérez vos interventions
            <br />
            <span className="bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
              de A à Z
            </span>
          </h1>
          <p className="mb-10 text-lg text-slate-400 max-w-xl mx-auto">
            De la demande client à la facture — une seule plateforme pour toutes vos interventions
            terrain.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-xl bg-white px-8 py-3.5 text-sm font-semibold text-slate-900 shadow-lg transition-all hover:bg-slate-100 hover:shadow-xl"
          >
            Accéder à la plateforme
            <span aria-hidden="true">→</span>
          </Link>
        </div>
      </section>

      {/* Features grid */}
      <section className="px-6 pb-20">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-12 text-center text-2xl font-semibold text-slate-200">
            Tout ce dont vous avez besoin
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <div
                key={f.title}
                className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md transition-colors hover:bg-white/8"
              >
                <div className="mb-3 text-2xl">{f.icon}</div>
                <h3 className="mb-3 font-semibold text-white">{f.title}</h3>
                <ul className="space-y-1">
                  {f.items.map((item) => (
                    <li key={item} className="flex items-center gap-2 text-sm text-slate-400">
                      <span className="h-1 w-1 rounded-full bg-emerald-500 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Billing + Commissions */}
      <section className="px-6 pb-20">
        <div className="mx-auto max-w-5xl">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-6">
              <div className="mb-3 text-2xl">🧾</div>
              <h3 className="mb-1 font-semibold text-white">Facturation</h3>
              <p className="mb-3 text-xs text-slate-400">Liée directement au dossier</p>
              <ul className="space-y-1">
                {["Facture liée au dossier", "Statut paiement", "Historique financier"].map(
                  (item) => (
                    <li key={item} className="flex items-center gap-2 text-sm text-slate-300">
                      <span className="h-1 w-1 rounded-full bg-emerald-400 shrink-0" />
                      {item}
                    </li>
                  )
                )}
              </ul>
            </div>
            <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-6">
              <div className="mb-3 text-2xl">💶</div>
              <h3 className="mb-1 font-semibold text-white">Commissions</h3>
              <p className="mb-3 text-xs text-slate-400">Multi-niveaux, flexible</p>
              <ul className="space-y-1">
                {["Mécanisme flexible", "Règles multi-niveaux", "Saisie manuelle"].map((item) => (
                  <li key={item} className="flex items-center gap-2 text-sm text-slate-300">
                    <span className="h-1 w-1 rounded-full bg-amber-400 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Pain points */}
      <section className="px-6 pb-20">
        <div className="mx-auto max-w-3xl rounded-2xl border border-red-500/20 bg-red-500/5 p-8">
          <h2 className="mb-6 text-xl font-semibold text-slate-200">
            Ce qu&apos;ils ne veulent plus
          </h2>
          <div className="space-y-3">
            {painPoints.map((p) => (
              <div key={p} className="flex items-center gap-3 text-slate-400">
                <span className="shrink-0 text-red-400">✗</span>
                <span>{p}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Roadmap */}
      <section className="px-6 pb-20">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-8 text-center text-xl font-semibold text-slate-200">
            En développement
          </h2>
          <div className="flex flex-wrap justify-center gap-2">
            {roadmap.map((item) => (
              <span
                key={item}
                className="rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-xs font-medium text-blue-300"
              >
                {item}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 pb-28 text-center">
        <div className="mx-auto max-w-xl">
          <h2 className="mb-4 text-2xl font-bold text-white">Prêt à démarrer ?</h2>
          <p className="mb-8 text-slate-400">
            Accédez à votre espace de gestion d&apos;interventions.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-emerald-600 px-8 py-3.5 text-sm font-semibold text-white shadow-lg transition-all hover:opacity-90"
          >
            Ouvrir la plateforme
            <span aria-hidden="true">→</span>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 px-6 py-8 text-center text-xs text-slate-600">
        CRMSLOT — Plateforme de gestion d&apos;interventions terrain · Belgique
      </footer>
    </main>
  );
}
