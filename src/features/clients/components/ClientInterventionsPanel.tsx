"use client";

import { ClipboardList, ExternalLink, Wrench } from "lucide-react";
import { toast } from "sonner";
import {
  navigateCompanyHub,
  COMPANY_HUB_ANCHOR_SMART_FORM,
} from "@/features/company/companyHubNavigation";
import { useTranslation } from "@/core/i18n/I18nContext";
import { useFeatureFlag } from "@/core/useFeatureFlags";
import { useDashboardPagerOptional } from "@/features/dashboard/dashboardPagerContext";
import { useBackofficeInboxIntentOptional } from "@/context/BackofficeInboxIntentContext";
import { openBackofficeIntervention } from "@/features/backoffice/openBackofficeIntervention";
import { useClientInterventions } from "@/features/clients/useClientInterventions";
import { statusLabelKey } from "@/features/interventions/technicianSchedule";

type Props = {
  companyId: string;
  clientId: string;
};

function formatInterventionDate(iv: {
  scheduledDate?: string | null;
  date?: string | null;
  createdAt?: string;
}): string {
  const raw = iv.scheduledDate?.trim() || iv.date?.trim() || iv.createdAt?.trim() || "";
  if (!raw) return "—";
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return raw.slice(0, 10);
  return d.toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" });
}

export default function ClientInterventionsPanel({ companyId, clientId }: Props) {
  const { t } = useTranslation();
  const pwaV2 = useFeatureFlag("pwaV2Bundle");
  const pager = useDashboardPagerOptional();
  const inboxIntent = useBackofficeInboxIntentOptional();
  const { interventions, loading } = useClientInterventions(companyId, clientId);

  return (
    <section
      data-testid="client-interventions-panel"
      className="mt-4 border-t border-slate-100 pt-3"
    >
      <p className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase text-slate-400">
        <ClipboardList className="h-3.5 w-3.5" />
        {t("crm.interventions_title")}
      </p>
      {loading ? (
        <p className="text-sm text-slate-400">{t("common.loading")}</p>
      ) : interventions.length === 0 ? (
        <p data-testid="client-interventions-empty" className="text-sm text-slate-500">
          {t("crm.interventions_empty")}
        </p>
      ) : (
        <ul data-testid="client-interventions-list" className="max-h-48 space-y-1 overflow-y-auto">
          {interventions.map((iv) => (
            <li
              key={iv.id}
              data-testid={`client-intervention-row-${iv.id}`}
              className="rounded-md bg-slate-50 px-2 py-2 text-sm"
            >
              <div className="flex items-start justify-between gap-2">
                <span className="min-w-0 flex-1 font-semibold text-slate-800">
                  {iv.title?.trim() || iv.problem?.trim() || iv.id}
                </span>
                <span className="shrink-0 text-[10px] font-bold uppercase text-slate-500">
                  {t(statusLabelKey(iv.status))}
                </span>
              </div>
              <p className="mt-0.5 truncate text-xs text-slate-500">{iv.address || "—"}</p>
              <p className="text-[10px] text-slate-400">{formatInterventionDate(iv)}</p>
              {pwaV2 ? (
                <div className="mt-1 flex flex-wrap gap-2">
                  <button
                    type="button"
                    data-testid={`client-intervention-open-${iv.id}`}
                    onClick={() =>
                      openBackofficeIntervention(pager, inboxIntent?.setPendingInboxId, iv.id)
                    }
                    className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:underline"
                  >
                    <ExternalLink className="h-3 w-3" />
                    {t("crm.open_in_backoffice")}
                  </button>
                  <button
                    type="button"
                    data-testid={`client-intervention-sav-${iv.id}`}
                    onClick={() => {
                      if (typeof sessionStorage !== "undefined") {
                        sessionStorage.setItem("crmslot_prefill_sav", iv.id);
                        sessionStorage.setItem(
                          "crmslot_prefill_client",
                          JSON.stringify({
                            clientName:
                              [iv.clientFirstName, iv.clientLastName].filter(Boolean).join(" ") ||
                              iv.clientName,
                            phone: iv.clientPhone,
                            email: iv.clientEmail,
                            clientId,
                            parentInterventionId: iv.id,
                          })
                        );
                      }
                      navigateCompanyHub(pager, COMPANY_HUB_ANCHOR_SMART_FORM);
                      toast.success(String(t("sav.follow_up")));
                    }}
                    className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 hover:underline"
                  >
                    <Wrench className="h-3 w-3" />
                    {t("sav.follow_up")}
                  </button>
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
