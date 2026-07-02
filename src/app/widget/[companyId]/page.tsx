"use client";

import { useState, useEffect } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { addDoc, collection } from "firebase/firestore";
import { signInAnonymously } from "firebase/auth";
import { auth, firestore, isConfigured } from "@/core/config/firebase";
import { logCrmInterventionCreated } from "@/features/crmHistory";
import { notifyStaffNewClientRequestClient } from "@/features/notifications/notifyStaffNewClientRequestClient";
import { CheckCircle2 } from "lucide-react";

export default function WidgetPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const companyId = typeof params.companyId === "string" ? params.companyId : "";
  const prefillAddress = searchParams.get("address") ?? "";

  const [address, setAddress] = useState(prefillAddress);
  const [problem, setProblem] = useState("");
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (prefillAddress) setAddress(prefillAddress);
  }, [prefillAddress]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isConfigured || !firestore || !auth || !address || !problem) return;
    setSubmitting(true);
    try {
      let uid = auth.currentUser?.uid ?? "";
      if (!uid) {
        const cred = await signInAnonymously(auth);
        uid = cred.user.uid;
      }
      const { portalAccessTokenField } =
        await import("@/features/interventions/ensurePortalAccessToken");
      const createdRef = await addDoc(collection(firestore, "interventions"), {
        companyId,
        address,
        problem,
        clientPhone: phone || null,
        status: "pending",
        createdAt: new Date().toISOString(),
        createdByUid: uid,
        source: "widget_qr",
        ...portalAccessTokenField(),
      });
      void logCrmInterventionCreated({
        intervention: {
          id: createdRef.id,
          title: problem.trim().slice(0, 140) || "Demande widget",
          address: address.trim(),
          status: "pending",
          companyId,
        },
        actorUid: uid,
        actorRole: "client",
        source: "widget_qr",
      });
      void notifyStaffNewClientRequestClient({
        companyId,
        interventionId: createdRef.id,
        title: problem.trim().slice(0, 140) || "Demande widget",
        address: address.trim(),
        user: auth.currentUser,
      });
      setDone(true);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-xl border border-black/5 overflow-hidden">
        <div className="bg-slate-900 px-6 py-5">
          <h1 className="text-white font-bold text-[18px]">Demande d&apos;intervention</h1>
          <p className="text-slate-400 text-[13px] mt-0.5">
            Remplissez ce formulaire et nous vous rappelons.
          </p>
        </div>

        {done ? (
          <div className="flex flex-col items-center justify-center gap-3 px-6 py-10 text-center">
            <CheckCircle2 className="h-12 w-12 text-emerald-500" />
            <p className="text-[17px] font-bold text-slate-800">Demande envoyée !</p>
            <p className="text-[13px] text-slate-500">
              Notre équipe vous contacte dans les plus brefs délais.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4 px-6 py-6">
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Adresse
              </label>
              <input
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Rue, numéro, ville"
                className="rounded-xl border border-black/10 px-3 py-2.5 text-[14px] focus:outline-none focus:ring-2 focus:ring-black/10"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Problème *
              </label>
              <textarea
                required
                rows={3}
                value={problem}
                onChange={(e) => setProblem(e.target.value)}
                placeholder="Décrivez votre problème…"
                className="resize-none rounded-xl border border-black/10 px-3 py-2.5 text-[14px] focus:outline-none focus:ring-2 focus:ring-black/10"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Téléphone
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+32 4xx xx xx xx"
                className="rounded-xl border border-black/10 px-3 py-2.5 text-[14px] focus:outline-none focus:ring-2 focus:ring-black/10"
              />
            </div>
            <button
              type="submit"
              disabled={submitting || !address || !problem}
              className="w-full rounded-xl bg-slate-900 py-3 text-[14px] font-bold text-white disabled:opacity-40 transition hover:bg-slate-800"
            >
              {submitting ? "Envoi…" : "Envoyer la demande"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
