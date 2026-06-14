"use client";

import { useEffect, useState } from "react";
import {
  collection,
  onSnapshot,
  addDoc,
  updateDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore";
import { Webhook } from "lucide-react";
import { toast } from "sonner";
import { firestore } from "@/core/config/firebase";
import { useCompanyWorkspaceOptional } from "@/context/CompanyWorkspaceContext";
import { useFeatureFlag } from "@/core/useFeatureFlags";
import { useTranslation } from "@/core/i18n/I18nContext";
import type { WebhookEndpoint, WebhookEventType } from "../types";

const ALL_EVENTS: WebhookEventType[] = [
  "intervention.status_changed",
  "intervention.invoiced",
  "intervention.payment_received",
];

export default function WebhookEndpointsPanel() {
  const { t } = useTranslation();
  const enabled = useFeatureFlag("outboundWebhooks");
  const workspace = useCompanyWorkspaceOptional();
  const companyId = workspace?.activeCompanyId?.trim() ?? "";
  const isAdmin = workspace?.activeRole === "admin";

  const [endpoints, setEndpoints] = useState<WebhookEndpoint[]>([]);
  const [url, setUrl] = useState("");
  const [secret, setSecret] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!enabled || !firestore || !companyId) return;
    const col = collection(firestore, "companies", companyId, "webhookEndpoints");
    return onSnapshot(col, (snap) => {
      setEndpoints(
        snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<WebhookEndpoint, "id">) }))
      );
    });
  }, [enabled, companyId]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firestore || !companyId || !url.trim() || !secret.trim()) return;
    setBusy(true);
    try {
      await addDoc(collection(firestore, "companies", companyId, "webhookEndpoints"), {
        companyId,
        url: url.trim(),
        secret: secret.trim(),
        events: ALL_EVENTS,
        isActive: true,
        createdAt: serverTimestamp(),
      });
      setUrl("");
      setSecret("");
      toast.success(String(t("integrations.webhook_added")));
    } catch {
      toast.error(String(t("common.error")));
    } finally {
      setBusy(false);
    }
  };

  const handleToggle = async (id: string, active: boolean) => {
    if (!firestore || !companyId) return;
    await updateDoc(doc(firestore, "companies", companyId, "webhookEndpoints", id), {
      isActive: !active,
    });
  };

  if (!enabled || !companyId) return null;

  return (
    <section
      data-testid="webhook-endpoints-panel"
      className="space-y-3 rounded-xl border border-slate-200 bg-white p-4"
    >
      <div className="flex items-center gap-2">
        <Webhook className="h-4 w-4 text-slate-500" />
        <h3 className="text-sm font-bold text-slate-900">{t("integrations.webhooks_title")}</h3>
      </div>
      {isAdmin ? (
        <form onSubmit={(e) => void handleAdd(e)} className="grid gap-2">
          <input
            data-testid="webhook-url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://..."
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
          />
          <input
            data-testid="webhook-secret"
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
            placeholder={String(t("integrations.webhook_secret"))}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
          />
          <button
            type="submit"
            disabled={busy}
            data-testid="webhook-add"
            className="rounded-lg bg-slate-900 py-2 text-sm font-bold text-white disabled:opacity-50"
          >
            {t("integrations.webhook_add")}
          </button>
        </form>
      ) : null}
      <ul className="space-y-2">
        {endpoints.map((ep) => (
          <li
            key={ep.id}
            data-testid={`webhook-endpoint-${ep.id}`}
            className="flex items-center justify-between gap-2 rounded-lg border border-slate-100 px-3 py-2 text-xs"
          >
            <span className="truncate font-mono text-slate-600">{ep.url}</span>
            {isAdmin ? (
              <button
                type="button"
                onClick={() => void handleToggle(ep.id, ep.isActive)}
                className={`rounded px-2 py-0.5 font-bold ${ep.isActive ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}
              >
                {ep.isActive ? "ON" : "OFF"}
              </button>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}
