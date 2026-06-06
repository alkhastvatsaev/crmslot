"use client";

import { Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { type VariantProps } from "class-variance-authority";
import { badgeVariants } from "@/components/ui/badge";
import {
  backofficeRowStatusLabel,
  interventionBackofficeBucket,
  type BackofficeBucket,
} from "@/features/backoffice/backofficeBuckets";
import {
  formatScheduledLabel,
  interventionClientLabel,
} from "@/features/interventions/technicianSchedule";
import type { Intervention } from "@/features/interventions/types";
import type { Technician } from "@/features/technicians/types";
import { useTranslation } from "@/core/i18n/I18nContext";

type BadgeVariant = VariantProps<typeof badgeVariants>["variant"];

function bucketBadgeVariant(bucket: BackofficeBucket): BadgeVariant {
  switch (bucket) {
    case "pending":
      return "warning";
    case "in_progress":
      return "info";
    case "done":
      return "success";
    case "invoiced":
      return "violet";
    default:
      return "secondary";
  }
}

function technicianOptionLabel(uid: string, technicians: Technician[]): string {
  const tech = technicians.find((x) => x.id === uid);
  return tech?.name?.trim() ? `${tech.name} (${uid.slice(0, 6)}…)` : uid;
}

type BackOfficeInterventionsTableProps = {
  rows: Intervention[];
  technicians: Technician[];
  onRowClick: (iv: Intervention) => void;
  onDelete: (id: string) => void;
};

export default function BackOfficeInterventionsTable({
  rows,
  technicians,
  onRowClick,
  onDelete,
}: BackOfficeInterventionsTableProps) {
  const { t } = useTranslation();

  return (
    <table
      className="w-full min-w-[640px] border-collapse text-left text-[13px]"
      aria-label="Liste des dossiers"
    >
      <thead className="sticky top-0 z-10 bg-slate-50/95 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500 backdrop-blur-sm">
        <tr>
          <th className="border-b border-slate-100 px-2 py-2 sm:px-3" title="Client / dossier">
            Client
          </th>
          <th className="border-b border-slate-100 px-2 py-2 sm:px-3">État</th>
          <th className="border-b border-slate-100 px-2 py-2 sm:px-3" title="Technicien assigné">
            Tech
          </th>
          <th className="border-b border-slate-100 px-2 py-2 sm:px-3" title="Créneau planifié">
            Quand
          </th>
          <th
            className="border-b border-slate-100 px-2 py-2 sm:px-3"
            title="Adresse d'intervention"
          >
            Lieu
          </th>
          <th className="border-b border-slate-100 px-2 py-2 sm:px-3 w-[50px]"></th>
        </tr>
      </thead>
      <tbody>
        {rows.map((iv) => {
          const bucket = interventionBackofficeBucket(iv.status);
          const uid = (iv.assignedTechnicianUid ?? "").trim();
          return (
            <tr
              key={iv.id}
              role="button"
              tabIndex={0}
              data-testid={`back-office-row-${iv.id}`}
              onClick={() => onRowClick(iv)}
              onKeyDown={(ev) => {
                if (ev.key === "Enter" || ev.key === " ") {
                  ev.preventDefault();
                  onRowClick(iv);
                }
              }}
              className="cursor-pointer border-b border-slate-50 transition hover:bg-slate-50/90 focus-visible:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-slate-900/15"
            >
              <td className="max-w-[180px] px-3 py-2">
                <p className="truncate font-bold text-slate-900">{interventionClientLabel(iv)}</p>
                {(iv.clientPhone || iv.phone) && (
                  <p className="font-bold text-slate-900 mt-0.5 text-[13px]">
                    {iv.clientPhone || iv.phone}
                  </p>
                )}
                {iv.clientEmail && (
                  <p className="font-medium text-slate-600 mt-0.5 text-[13px] break-all">
                    <a
                      href={`mailto:${iv.clientEmail}`}
                      className="hover:underline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {iv.clientEmail}
                    </a>
                  </p>
                )}
              </td>
              <td className="px-3 py-2">
                <Badge variant={bucketBadgeVariant(bucket)}>
                  {backofficeRowStatusLabel(iv.status)}
                </Badge>
              </td>
              <td className="max-w-[140px] truncate px-3 py-2 font-medium text-slate-700">
                {uid ? technicianOptionLabel(uid, technicians) : "—"}
              </td>
              <td className="whitespace-nowrap px-3 py-2 font-medium text-slate-700">
                {formatScheduledLabel(iv)}
              </td>
              <td className="max-w-[220px] truncate px-3 py-2 text-slate-600">
                {iv.address?.trim() || "—"}
              </td>
              <td className="px-3 py-2 text-right">
                <button
                  type="button"
                  data-testid={`back-office-delete-${iv.id}`}
                  onClick={(ev) => {
                    ev.stopPropagation();
                    onDelete(iv.id);
                  }}
                  className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                  title={String(t("common.delete"))}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
