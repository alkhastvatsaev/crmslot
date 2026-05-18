"use client";

import { useEffect, useState } from "react";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
} from "firebase/firestore";
import {
  Package,
  CheckCircle2,
  Clock,
  XCircle,
  ExternalLink,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { firestore } from "@/core/config/firebase";
import { useTranslation } from "@/core/i18n/I18nContext";
import { scheduleEffectUpdate } from "@/utils/scheduleEffectUpdate";

const outfit = { fontFamily: "'Outfit', sans-serif" } as const;

interface MaterialOrder {
  id: string;
  interventionId: string;
  companyId: string;
  technicianUid: string;
  partsRequested: { description: string; quantity: number; reference?: string }[];
  urgency: "low" | "normal" | "high";
  status: "pending" | "approved" | "ordered" | "delivered" | "cancelled";
  createdAt: string;
  updatedAt?: string;
}

const STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  pending: { bg: "bg-amber-50", text: "text-amber-700", label: "En attente" },
  approved: { bg: "bg-blue-50", text: "text-blue-700", label: "Approuvé" },
  ordered: { bg: "bg-indigo-50", text: "text-indigo-700", label: "Commandé" },
  delivered: { bg: "bg-emerald-50", text: "text-emerald-700", label: "Livré" },
  cancelled: { bg: "bg-red-50", text: "text-red-600", label: "Annulé" },
};

const URGENCY_STYLES: Record<string, string> = {
  low: "bg-slate-100 text-slate-600",
  normal: "bg-blue-100 text-blue-600",
  high: "bg-red-100 text-red-600",
};

type Props = {
  companyId?: string | null;
};

export default function MaterialOrderManagement({ companyId }: Props) {
  const { t } = useTranslation();
  const activeCompanyId = companyId?.trim() || null;
  const [orders, setOrders] = useState<MaterialOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    if (!firestore || !activeCompanyId) return;

    scheduleEffectUpdate(() => setLoading(true));
    const q = query(
      collection(firestore, "material_orders"),
      where("companyId", "==", activeCompanyId),
      orderBy("createdAt", "desc"),
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        setOrders(
          snap.docs.map((d) => ({ id: d.id, ...d.data() } as MaterialOrder)),
        );
        setLoading(false);
      },
      () => setLoading(false),
    );

    return unsub;
  }, [activeCompanyId]);

  const updateStatus = async (orderId: string, newStatus: MaterialOrder["status"]) => {
    if (!firestore) return;
    setUpdatingId(orderId);
    try {
      await updateDoc(doc(firestore, "material_orders", orderId), {
        status: newStatus,
        updatedAt: new Date().toISOString(),
      });
      toast.success("Statut mis à jour");
    } catch {
      toast.error(String(t("materials.toast_error")));
    } finally {
      setUpdatingId(null);
    }
  };

  if (!activeCompanyId) {
    return null;
  }

  if (loading) {
    return (
      <div
        data-testid="material-orders-loading"
        style={outfit}
        className="flex items-center justify-center py-8"
      >
        <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
      </div>
    );
  }

  const pendingCount = orders.filter((o) => o.status === "pending").length;

  return (
    <div data-testid="material-order-management" style={outfit} className="space-y-3">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <Package className="h-4 w-4 text-slate-500" />
          <h3 className="text-[12px] font-bold uppercase tracking-widest text-slate-500">
            Commandes matériel
          </h3>
        </div>
        {pendingCount > 0 && (
          <span className="rounded-full bg-amber-500 px-2.5 py-0.5 text-[10px] font-bold text-white">
            {pendingCount} en attente
          </span>
        )}
      </div>

      {orders.length === 0 ? (
        <p className="py-6 text-center text-[13px] text-slate-400 font-medium">
          Aucune commande matériel
        </p>
      ) : (
        <div className="space-y-2">
          {orders.map((order) => {
            const style = STATUS_STYLES[order.status] ?? STATUS_STYLES.pending;
            const urgencyStyle = URGENCY_STYLES[order.urgency] ?? URGENCY_STYLES.normal;
            const isUpdating = updatingId === order.id;

            return (
              <div
                key={order.id}
                data-testid={`material-order-${order.id}`}
                className="rounded-xl border border-slate-100 bg-white p-3 space-y-2"
              >
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[9px] font-bold uppercase",
                        style.bg,
                        style.text,
                      )}
                    >
                      {style.label}
                    </span>
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[9px] font-bold uppercase",
                        urgencyStyle,
                      )}
                    >
                      {order.urgency}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400">
                    {new Date(order.createdAt).toLocaleDateString("fr-BE", {
                      day: "2-digit",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>

                {/* Parts list */}
                <div className="space-y-1">
                  {order.partsRequested.map((part, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between text-[12px]"
                    >
                      <span className="text-slate-700 font-medium truncate flex-1">
                        {part.description}
                      </span>
                      <div className="flex items-center gap-2 shrink-0 ml-2">
                        <span className="text-slate-500">×{part.quantity}</span>
                        {part.reference && (
                          <a
                            href={`https://lecot.be/fr-be/search?q=${encodeURIComponent(part.reference)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-0.5 rounded bg-slate-800 px-1.5 py-0.5 text-[9px] font-bold text-white hover:bg-slate-700 transition"
                          >
                            <ExternalLink className="h-2.5 w-2.5" />
                            {part.reference}
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Action buttons */}
                {order.status === "pending" && (
                  <div className="flex gap-2 pt-1">
                    <button
                      type="button"
                      disabled={isUpdating}
                      onClick={() => void updateStatus(order.id, "approved")}
                      className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-emerald-500 py-2 text-[11px] font-bold text-white transition hover:bg-emerald-600 disabled:opacity-50"
                    >
                      {isUpdating ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <CheckCircle2 className="h-3 w-3" />
                      )}
                      Approuver
                    </button>
                    <button
                      type="button"
                      disabled={isUpdating}
                      onClick={() => void updateStatus(order.id, "cancelled")}
                      className="flex items-center justify-center gap-1 rounded-lg bg-white border border-red-200 px-3 py-2 text-[11px] font-bold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                    >
                      <XCircle className="h-3 w-3" />
                    </button>
                  </div>
                )}

                {order.status === "approved" && (
                  <button
                    type="button"
                    disabled={isUpdating}
                    onClick={() => void updateStatus(order.id, "ordered")}
                    className="flex w-full items-center justify-center gap-1 rounded-lg bg-indigo-500 py-2 text-[11px] font-bold text-white transition hover:bg-indigo-600 disabled:opacity-50"
                  >
                    {isUpdating ? <Loader2 className="h-3 w-3 animate-spin" /> : <Package className="h-3 w-3" />}
                    Marquer commandé
                  </button>
                )}

                {order.status === "ordered" && (
                  <button
                    type="button"
                    disabled={isUpdating}
                    onClick={() => void updateStatus(order.id, "delivered")}
                    className="flex w-full items-center justify-center gap-1 rounded-lg bg-emerald-500 py-2 text-[11px] font-bold text-white transition hover:bg-emerald-600 disabled:opacity-50"
                  >
                    {isUpdating ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle2 className="h-3 w-3" />}
                    Marquer livré
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
