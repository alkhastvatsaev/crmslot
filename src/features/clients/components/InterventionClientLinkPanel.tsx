"use client";

import { useMemo, useState } from "react";
import { Link2, MapPin, User } from "lucide-react";
import { toast } from "sonner";
import { firestore } from "@/core/config/firebase";
import { useTranslation } from "@/core/i18n/I18nContext";
import { useFeatureFlag } from "@/core/useFeatureFlags";
import type { Intervention } from "@/features/interventions";
import { useClients } from "@/features/clients/useClients";
import { useClientSites } from "@/features/clients/useClientSites";
import { buildClientDisplayName } from "@/features/clients/clientDisplayName";
import { linkInterventionToClient } from "@/features/clients/linkInterventionToClient";

type Props = {
  intervention: Intervention;
};

export default function InterventionClientLinkPanel({ intervention }: Props) {
  const { t } = useTranslation();
  const crmEnabled = useFeatureFlag("crmContacts");
  const { clients, loading } = useClients();
  const companyId = intervention.companyId?.trim() ?? "";

  const linkedClientId = intervention.clientId?.trim() || null;
  const linkedSiteId = intervention.siteId?.trim() || null;

  const [pickClientId, setPickClientId] = useState<string | null>(linkedClientId);
  const [pickSiteId, setPickSiteId] = useState<string | null>(linkedSiteId);
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState(false);

  const { sites, loading: sitesLoading } = useClientSites(companyId, pickClientId);
  const pickedClient = clients.find((c) => c.id === pickClientId) ?? null;
  const pickedSite = sites.find((s) => s.id === pickSiteId) ?? null;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return clients;
    return clients.filter((c) => {
      const hay = [c.displayName, c.firstName, c.lastName, c.companyName, c.phone, c.email]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [clients, query]);

  if (!crmEnabled) {
    return (
      <p data-testid="intervention-crm-disabled" className="text-sm text-slate-500">
        {t("crm.disabled_hint")}
      </p>
    );
  }

  const handleLink = async () => {
    if (!firestore || !pickedClient) {
      toast.error(String(t("crm.pick_client_required")));
      return;
    }
    setBusy(true);
    try {
      await linkInterventionToClient(firestore, intervention.id, {
        clientId: pickedClient.id,
        siteId: pickSiteId,
        client: pickedClient,
        site: pickedSite,
      });
      toast.success(String(t("crm.intervention_linked")));
    } catch {
      toast.error(String(t("common.error")));
    } finally {
      setBusy(false);
    }
  };

  const linkedLabel =
    intervention.clientName?.trim() ||
    [intervention.clientFirstName, intervention.clientLastName].filter(Boolean).join(" ").trim() ||
    null;

  return (
    <div data-testid="intervention-client-link-panel" className="space-y-4">
      <div>
        <h3 className="text-sm font-bold text-slate-900">{t("crm.link_title")}</h3>
        <p className="text-xs text-slate-500">{t("crm.link_subtitle")}</p>
      </div>

      {linkedLabel || linkedClientId ? (
        <div
          data-testid="intervention-crm-current"
          className="rounded-lg border border-emerald-100 bg-emerald-50/60 px-3 py-2 text-sm"
        >
          <p className="font-semibold text-emerald-900">{linkedLabel || linkedClientId}</p>
          {intervention.address ? (
            <p className="text-xs text-emerald-800/80">{intervention.address}</p>
          ) : null}
        </div>
      ) : (
        <p data-testid="intervention-crm-unlinked" className="text-sm text-slate-500">
          {t("crm.intervention_unlinked")}
        </p>
      )}

      <input
        data-testid="intervention-crm-client-search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={String(t("crm.search_placeholder"))}
        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
      />

      <ul
        className="max-h-40 space-y-1 overflow-y-auto rounded-lg border border-slate-100 p-2"
        data-testid="intervention-crm-clients-list"
      >
        {loading ? (
          <li className="px-2 py-2 text-center text-sm text-slate-400">{t("common.loading")}</li>
        ) : filtered.length === 0 ? (
          <li className="px-2 py-2 text-center text-sm text-slate-500">{t("crm.clients_empty")}</li>
        ) : (
          filtered.map((c) => (
            <li key={c.id}>
              <button
                type="button"
                data-testid={`intervention-crm-client-${c.id}`}
                onClick={() => {
                  setPickClientId(c.id);
                  setPickSiteId(null);
                }}
                className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm ${
                  pickClientId === c.id ? "bg-slate-900 text-white" : "hover:bg-slate-50"
                }`}
              >
                <User className="h-4 w-4 shrink-0" />
                {buildClientDisplayName(c) || c.id}
              </button>
            </li>
          ))
        )}
      </ul>

      {pickClientId ? (
        <div className="space-y-2" data-testid="intervention-crm-sites">
          <p className="text-xs font-bold uppercase text-slate-400">{t("crm.pick_site")}</p>
          {sitesLoading ? (
            <p className="text-sm text-slate-400">{t("common.loading")}</p>
          ) : sites.length === 0 ? (
            <p className="text-sm text-slate-500">{t("crm.sites_empty")}</p>
          ) : (
            <ul className="space-y-1">
              {sites.map((s) => (
                <li key={s.id}>
                  <button
                    type="button"
                    data-testid={`intervention-crm-site-${s.id}`}
                    onClick={() => setPickSiteId(s.id)}
                    className={`flex w-full items-start gap-2 rounded-md px-2 py-1.5 text-left text-sm ${
                      pickSiteId === s.id
                        ? "bg-emerald-600 text-white"
                        : "bg-slate-50 hover:bg-slate-100"
                    }`}
                  >
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>
                      <span className="font-semibold">{s.label}</span>
                      <span className="block text-xs opacity-80">{s.address}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}

      <button
        type="button"
        data-testid="intervention-crm-link-submit"
        disabled={busy || !pickedClient}
        onClick={() => void handleLink()}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-slate-900 py-2.5 text-sm font-bold text-white disabled:opacity-40"
      >
        <Link2 className="h-4 w-4" />
        {t("crm.link_submit")}
      </button>
    </div>
  );
}
