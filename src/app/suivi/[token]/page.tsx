import type { Metadata } from "next";
import type { PortalInterventionSummary } from "@/features/interventions";
import PortalQuoteSection from "@/features/interventions/components/PortalQuoteSection";
import PortalSignSection from "@/features/interventions/components/PortalSignSection";

export const revalidate = 0;

const STATUS_STEPS: Array<{ key: string; label: string }> = [
  { key: "pending", label: "Demande reçue" },
  { key: "assigned", label: "Technicien assigné" },
  { key: "en_route", label: "En route" },
  { key: "in_progress", label: "Intervention en cours" },
  { key: "done", label: "Terminé" },
  { key: "invoiced", label: "Facturé" },
];

const STATUS_ORDER: Record<string, number> = {
  pending: 0,
  pending_needs_address: 0,
  assigned: 1,
  en_route: 2,
  in_progress: 3,
  waiting_material: 3,
  done: 4,
  invoiced: 5,
  cancelled: -1,
};

function formatDate(date: string | null, time: string | null): string | null {
  if (!date) return null;
  const parts = date.split("-");
  if (parts.length !== 3) return date;
  const [y, m, d] = parts;
  const base = `${d}/${m}/${y}`;
  return time ? `${base} à ${time}` : base;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ token: string }>;
}): Promise<Metadata> {
  return { title: "Suivi de votre intervention — CRMSLOT" };
}

async function fetchPortalData(token: string): Promise<PortalInterventionSummary | null> {
  const base =
    process.env.NEXT_PUBLIC_BASE_URL ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");
  try {
    const res = await fetch(`${base}/api/portal/${token}`, {
      cache: "no-store",
    });
    if (!res.ok) return null;
    return (await res.json()) as PortalInterventionSummary;
  } catch {
    return null;
  }
}

export default async function PortalTrackingPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const data = await fetchPortalData(token);

  if (!data) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-6">
        <div className="w-full max-w-md rounded-[24px] bg-white p-8 shadow-sm ring-1 ring-black/5 text-center space-y-4">
          <div className="text-4xl">🔗</div>
          <h1 className="text-xl font-bold text-slate-800">Lien invalide ou expiré</h1>
          <p className="text-sm text-slate-500">
            Ce lien de suivi n&apos;est plus valide. Contactez l&apos;entreprise pour obtenir un
            nouveau lien.
          </p>
        </div>
      </main>
    );
  }

  const currentOrder = STATUS_ORDER[data.status] ?? 0;
  const isCancelled = data.status === "cancelled";
  const clientName =
    [data.clientFirstName, data.clientLastName].filter(Boolean).join(" ") || "Client";
  const scheduledLabel = formatDate(data.scheduledDate, data.scheduledTime);

  return (
    <main className="flex min-h-screen flex-col items-center bg-slate-50 py-10 px-4">
      <div className="w-full max-w-lg space-y-5">
        {/* Header */}
        <div className="rounded-[24px] bg-white p-6 shadow-sm ring-1 ring-black/5">
          <p className="text-[12px] font-semibold uppercase tracking-widest text-slate-400 mb-1">
            CRMSLOT
          </p>
          <h1 className="text-[22px] font-black text-slate-900">Suivi de votre intervention</h1>
          <p className="mt-1 text-[14px] text-slate-500">Bonjour {clientName}</p>
          {data.problem && (
            <p className="mt-3 text-[14px] text-slate-700 bg-slate-50 rounded-xl p-3 leading-relaxed">
              {data.problem}
            </p>
          )}
        </div>

        {/* Status stepper */}
        {isCancelled ? (
          <div className="rounded-[24px] bg-red-50 p-6 ring-1 ring-red-100">
            <p className="text-[16px] font-bold text-red-700">Intervention annulée</p>
            <p className="text-[13px] text-red-500 mt-1">
              Cette intervention a été annulée. Contactez-nous pour plus d&apos;informations.
            </p>
          </div>
        ) : (
          <div className="rounded-[24px] bg-white p-6 shadow-sm ring-1 ring-black/5 space-y-0">
            <h2 className="text-[13px] font-bold text-slate-500 uppercase tracking-wider mb-4">
              Progression
            </h2>
            <ol className="space-y-0">
              {STATUS_STEPS.map((step, idx) => {
                const stepOrder = idx;
                const isDone = stepOrder < currentOrder;
                const isCurrent = stepOrder === currentOrder;
                return (
                  <li key={step.key} className="flex items-start gap-3">
                    <div className="flex flex-col items-center">
                      <div
                        className={[
                          "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[12px] font-bold transition-colors",
                          isDone
                            ? "bg-emerald-500 text-white"
                            : isCurrent
                              ? "bg-blue-600 text-white ring-4 ring-blue-100"
                              : "bg-slate-100 text-slate-400",
                        ].join(" ")}
                      >
                        {isDone ? "✓" : idx + 1}
                      </div>
                      {idx < STATUS_STEPS.length - 1 && (
                        <div
                          className={[
                            "w-0.5 h-6 mt-0.5",
                            isDone ? "bg-emerald-300" : "bg-slate-100",
                          ].join(" ")}
                        />
                      )}
                    </div>
                    <div className="pb-4 pt-1">
                      <p
                        className={[
                          "text-[14px] font-semibold leading-tight",
                          isCurrent
                            ? "text-blue-700"
                            : isDone
                              ? "text-emerald-700"
                              : "text-slate-400",
                        ].join(" ")}
                      >
                        {step.label}
                      </p>
                      {isCurrent && data.status === "waiting_material" && (
                        <p className="text-[12px] text-amber-600 mt-0.5">En attente de matériel</p>
                      )}
                    </div>
                  </li>
                );
              })}
            </ol>
          </div>
        )}

        {!isCancelled && data.quotes?.length ? (
          <PortalQuoteSection portalToken={token} quotes={data.quotes} />
        ) : null}

        {/* Payment card */}
        {!isCancelled &&
          data.paymentStatus !== "paid" &&
          typeof data.invoiceAmountCents === "number" &&
          data.invoiceAmountCents > 0 && (
            <div
              data-testid="portal-payment-card"
              className="rounded-[24px] bg-white p-6 shadow-sm ring-1 ring-black/5 space-y-3"
            >
              <h2 className="text-[13px] font-bold text-slate-500 uppercase tracking-wider">
                Paiement
              </h2>
              <div className="flex items-center justify-between">
                <span className="text-[14px] text-slate-500">Montant à régler</span>
                <span className="text-[18px] font-black text-slate-900">
                  {(data.invoiceAmountCents / 100).toFixed(2).replace(".", ",")} €
                </span>
              </div>
              {data.paymentLinkUrl ? (
                <a
                  href={data.paymentLinkUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-testid="portal-pay-button"
                  className="block w-full rounded-xl bg-black px-5 py-3 text-center text-[14px] font-bold text-white transition hover:bg-black/85"
                >
                  Payer en ligne
                </a>
              ) : (
                <p className="text-[12px] text-slate-400">
                  Le lien de paiement vous sera communiqué par l&apos;entreprise.
                </p>
              )}
              {data.paymentStatus === "pending" && (
                <p className="text-[11px] text-slate-400 text-center">
                  Paiement en cours de confirmation…
                </p>
              )}
            </div>
          )}

        {!isCancelled && data.status === "done" ? (
          <PortalSignSection
            interventionId={data.id}
            portalToken={token}
            clientName={[data.clientFirstName, data.clientLastName].filter(Boolean).join(" ")}
          />
        ) : null}

        {/* Details card */}
        <div className="rounded-[24px] bg-white p-6 shadow-sm ring-1 ring-black/5 space-y-3">
          <h2 className="text-[13px] font-bold text-slate-500 uppercase tracking-wider">Détails</h2>
          <div className="space-y-2 text-[14px]">
            <div className="flex justify-between">
              <span className="text-slate-500">Adresse</span>
              <span className="font-medium text-slate-800 text-right max-w-[60%]">
                {data.address}
              </span>
            </div>
            {scheduledLabel && (
              <div className="flex justify-between">
                <span className="text-slate-500">Planifié</span>
                <span className="font-medium text-slate-800">{scheduledLabel}</span>
              </div>
            )}
            {data.assignedTechnicianName && (
              <div className="flex justify-between">
                <span className="text-slate-500">Technicien</span>
                <span className="font-medium text-slate-800">{data.assignedTechnicianName}</span>
              </div>
            )}
            {data.paymentStatus === "paid" && (
              <div className="flex justify-between">
                <span className="text-slate-500">Paiement</span>
                <span className="font-semibold text-emerald-600">Payé ✓</span>
              </div>
            )}
          </div>
        </div>

        <p className="text-center text-[11px] text-slate-400">
          Lien de suivi privé — ne pas partager publiquement
        </p>
      </div>
    </main>
  );
}
