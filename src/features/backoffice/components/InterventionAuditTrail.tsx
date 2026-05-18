"use client";

import { useEffect, useState } from "react";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
} from "firebase/firestore";
import { firestore } from "@/core/config/firebase";
import type { InterventionStatusEvent } from "@/features/interventions/workflow/interventionWorkflowTypes";
import { Clock, ArrowRight, User, MessageSquare } from "lucide-react";
import { useTranslation } from "@/core/i18n/I18nContext";

const outfit = { fontFamily: "'Outfit', sans-serif" } as const;

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-slate-100 text-slate-600",
  pending_needs_address: "bg-slate-100 text-slate-600",
  assigned: "bg-blue-100 text-blue-700",
  en_route: "bg-indigo-100 text-indigo-700",
  in_progress: "bg-amber-100 text-amber-700",
  waiting_material: "bg-orange-100 text-orange-700",
  done: "bg-emerald-100 text-emerald-700",
  invoiced: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-700",
};

const ROLE_LABELS: Record<string, string> = {
  dispatcher: "Back-office",
  technician: "Technicien",
  client: "Client",
  system: "Système",
};

type Props = {
  interventionId: string;
};

export default function InterventionAuditTrail({ interventionId }: Props) {
  const { t } = useTranslation();
  const [events, setEvents] = useState<InterventionStatusEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!firestore || !interventionId) {
      setLoading(false);
      return;
    }

    const q = query(
      collection(firestore, "interventions", interventionId, "status_events"),
      orderBy("at", "desc"),
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        const docs = snap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as InterventionStatusEvent[];
        setEvents(docs);
        setLoading(false);
      },
      () => setLoading(false),
    );

    return unsub;
  }, [interventionId]);

  if (loading) {
    return (
      <div
        data-testid="audit-trail-loading"
        style={outfit}
        className="flex items-center justify-center py-8"
      >
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-200 border-t-slate-600" />
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div
        data-testid="audit-trail-empty"
        style={outfit}
        className="py-6 text-center text-[13px] text-slate-400 font-medium"
      >
        {String(t("audit.no_events"))}
      </div>
    );
  }

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return "—";
    const now = new Date();
    const isToday =
      d.getDate() === now.getDate() &&
      d.getMonth() === now.getMonth() &&
      d.getFullYear() === now.getFullYear();

    const time = d.toLocaleTimeString("fr-BE", {
      hour: "2-digit",
      minute: "2-digit",
    });

    if (isToday) return time;
    return `${d.toLocaleDateString("fr-BE", { day: "2-digit", month: "short" })} ${time}`;
  };

  return (
    <div
      data-testid="audit-trail"
      style={outfit}
      className="space-y-1"
    >
      <div className="flex items-center gap-2 px-1 pb-2">
        <Clock className="h-4 w-4 text-slate-500" />
        <h3 className="text-[12px] font-bold uppercase tracking-widest text-slate-500">
          {String(t("audit.title"))}
        </h3>
        <span className="ml-auto rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500">
          {events.length}
        </span>
      </div>

      <div className="relative space-y-0">
        {/* Vertical timeline line */}
        <div className="absolute left-[19px] top-4 bottom-4 w-px bg-slate-200" />

        {events.map((evt, idx) => (
          <div
            key={evt.id}
            data-testid={`audit-event-${evt.id}`}
            className="relative flex gap-3 py-2 pl-1"
          >
            {/* Timeline dot */}
            <div className="relative z-10 flex h-[38px] w-[38px] shrink-0 items-center justify-center">
              <div
                className={`flex h-7 w-7 items-center justify-center rounded-full ${
                  idx === 0
                    ? "bg-slate-900 text-white shadow-sm"
                    : "bg-white border border-slate-200 text-slate-400"
                }`}
              >
                <ArrowRight className="h-3.5 w-3.5" />
              </div>
            </div>

            {/* Content */}
            <div className="min-w-0 flex-1 pt-1">
              <div className="flex flex-wrap items-center gap-1.5">
                {evt.fromStatus && (
                  <>
                    <span
                      className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        STATUS_COLORS[evt.fromStatus] ?? "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {evt.fromStatus}
                    </span>
                    <ArrowRight className="h-3 w-3 text-slate-300" />
                  </>
                )}
                <span
                  className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold ${
                    STATUS_COLORS[evt.toStatus] ?? "bg-slate-100 text-slate-500"
                  }`}
                >
                  {evt.toStatus}
                </span>
              </div>

              <div className="mt-1 flex items-center gap-2 text-[11px] text-slate-400">
                <User className="h-3 w-3" />
                <span className="font-medium">
                  {ROLE_LABELS[evt.actorRole] ?? evt.actorRole}
                </span>
                <span>·</span>
                <span>{formatTime(evt.at)}</span>
              </div>

              {evt.note && (
                <div className="mt-1.5 flex items-start gap-1.5 rounded-lg bg-slate-50 px-2.5 py-1.5 text-[11px] text-slate-600">
                  <MessageSquare className="mt-0.5 h-3 w-3 shrink-0 text-slate-400" />
                  <span>{evt.note}</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
