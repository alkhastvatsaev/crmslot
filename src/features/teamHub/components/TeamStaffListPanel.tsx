"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, Pencil, UserCheck, UserX } from "lucide-react";
import { useTranslation } from "@/core/i18n/I18nContext";
import type { CompanyStaffMember } from "@/features/teamHub/types";
import { useCompanyStaffActions } from "@/features/teamHub/hooks/useCompanyStaffActions";

type Props = {
  companyId: string;
  staff: CompanyStaffMember[];
  loading: boolean;
  loadError: string | null;
  onRefresh: () => Promise<void>;
};

type Filter = "all" | "active" | "inactive";

export default function TeamStaffListPanel({
  companyId,
  staff,
  loading,
  loadError,
  onRefresh,
}: Props) {
  const { t } = useTranslation();
  const [filter, setFilter] = useState<Filter>("active");
  const [selectedUid, setSelectedUid] = useState<string | null>(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [vehicle, setVehicle] = useState("");

  const { busyUid, error, updateMember, setMemberActive, clearError } = useCompanyStaffActions(
    companyId,
    () => void onRefresh()
  );

  const filtered = useMemo(() => {
    if (filter === "all") return staff;
    if (filter === "active") return staff.filter((m) => m.active);
    return staff.filter((m) => !m.active);
  }, [filter, staff]);

  const selected = staff.find((m) => m.uid === selectedUid) ?? null;

  useEffect(() => {
    if (!selected) {
      setFirstName("");
      setLastName("");
      setEmail("");
      setVehicle("");
      return;
    }
    setFirstName(selected.firstName);
    setLastName(selected.lastName);
    setEmail(selected.email ?? "");
    setVehicle(selected.vehicle ?? "");
    clearError();
  }, [selected, clearError]);

  const handleSave = async () => {
    if (!selected) return;
    const ok = await updateMember(selected.uid, {
      firstName,
      lastName,
      email: email.trim() || null,
      vehicle: vehicle.trim() || undefined,
    });
    if (ok) setSelectedUid(null);
  };

  return (
    <div
      data-testid="team-staff-list-panel"
      className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden p-4 sm:p-5"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">{t("teamHub.title")}</h1>
          <p className="mt-0.5 text-[13px] text-slate-500">{t("teamHub.subtitle")}</p>
        </div>
        <div
          className="flex rounded-xl border border-slate-200 bg-white p-0.5"
          data-testid="team-staff-filter"
        >
          {(["active", "inactive", "all"] as const).map((key) => (
            <button
              key={key}
              type="button"
              data-testid={`team-staff-filter-${key}`}
              onClick={() => setFilter(key)}
              className={`rounded-lg px-3 py-1.5 text-[12px] font-medium transition ${
                filter === key ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              {t(`teamHub.filter.${key}`)}
            </button>
          ))}
        </div>
      </div>

      {loadError ? (
        <div
          role="alert"
          data-testid="team-staff-load-error"
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-700"
        >
          {loadError}
        </div>
      ) : null}

      {error ? (
        <div
          role="alert"
          data-testid="team-staff-action-error"
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-700"
        >
          {error}
        </div>
      ) : null}

      <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <section className="min-h-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {loading ? (
            <div
              className="flex h-40 items-center justify-center"
              data-testid="team-staff-loading"
              aria-busy="true"
            >
              <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
            </div>
          ) : filtered.length === 0 ? (
            <p
              data-testid="team-staff-empty"
              className="px-4 py-10 text-center text-[13px] text-slate-500"
            >
              {t("teamHub.empty")}
            </p>
          ) : (
            <ul className="divide-y divide-slate-100 overflow-y-auto" data-testid="team-staff-list">
              {filtered.map((member) => (
                <li key={member.uid}>
                  <button
                    type="button"
                    data-testid={`team-staff-row-${member.uid}`}
                    onClick={() => setSelectedUid(member.uid)}
                    className={`flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-slate-50 ${
                      selectedUid === member.uid ? "bg-blue-50/70" : ""
                    }`}
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm font-bold text-slate-700">
                      {(member.displayName.trim().charAt(0) || "?").toUpperCase()}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[14px] font-semibold text-slate-900">
                        {member.displayName}
                      </span>
                      <span className="block truncate text-[12px] text-slate-500">
                        {member.email || t("teamHub.no_email")}
                      </span>
                    </span>
                    <span className="shrink-0 rounded-md border border-slate-200 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-600">
                      {t(`teamHub.role.${member.role}`)}
                    </span>
                    <span
                      data-testid={`team-staff-status-${member.uid}`}
                      className={`shrink-0 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                        member.active
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {member.active ? t("teamHub.status.active") : t("teamHub.status.inactive")}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section
          className="flex min-h-0 flex-col rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
          data-testid="team-staff-detail"
        >
          {!selected ? (
            <p className="m-auto px-4 text-center text-[13px] text-slate-500">
              {t("teamHub.select_member")}
            </p>
          ) : (
            <>
              <div className="mb-4 flex items-center justify-between gap-2">
                <h2 className="text-[15px] font-semibold text-slate-900">{selected.displayName}</h2>
                <span className="text-[11px] text-slate-400">{selected.uid}</span>
              </div>

              <div className="flex flex-col gap-3">
                <label className="flex flex-col gap-1 text-[12px] font-medium text-slate-600">
                  {t("teamHub.fields.first_name")}
                  <input
                    data-testid="team-staff-edit-first-name"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="rounded-xl border border-slate-200 px-3 py-2 text-[14px] text-slate-900"
                  />
                </label>
                <label className="flex flex-col gap-1 text-[12px] font-medium text-slate-600">
                  {t("teamHub.fields.last_name")}
                  <input
                    data-testid="team-staff-edit-last-name"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="rounded-xl border border-slate-200 px-3 py-2 text-[14px] text-slate-900"
                  />
                </label>
                <label className="flex flex-col gap-1 text-[12px] font-medium text-slate-600">
                  {t("teamHub.fields.email")}
                  <input
                    data-testid="team-staff-edit-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="rounded-xl border border-slate-200 px-3 py-2 text-[14px] text-slate-900"
                  />
                </label>
                <label className="flex flex-col gap-1 text-[12px] font-medium text-slate-600">
                  {t("teamHub.fields.vehicle")}
                  <input
                    data-testid="team-staff-edit-vehicle"
                    value={vehicle}
                    onChange={(e) => setVehicle(e.target.value)}
                    className="rounded-xl border border-slate-200 px-3 py-2 text-[14px] text-slate-900"
                  />
                </label>
              </div>

              <div className="mt-auto flex flex-col gap-2 pt-5">
                <button
                  type="button"
                  data-testid="team-staff-save"
                  disabled={busyUid === selected.uid}
                  onClick={() => void handleSave()}
                  className="flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 text-[14px] font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
                >
                  {busyUid === selected.uid ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Pencil className="h-4 w-4" />
                  )}
                  {t("teamHub.save")}
                </button>

                {selected.active ? (
                  <button
                    type="button"
                    data-testid="team-staff-deactivate"
                    disabled={busyUid === selected.uid}
                    onClick={() => void setMemberActive(selected, false)}
                    className="flex h-11 items-center justify-center gap-2 rounded-xl border border-amber-200 bg-amber-50 text-[14px] font-semibold text-amber-800 hover:bg-amber-100 disabled:opacity-60"
                  >
                    <UserX className="h-4 w-4" />
                    {t("teamHub.deactivate")}
                  </button>
                ) : (
                  <button
                    type="button"
                    data-testid="team-staff-reactivate"
                    disabled={busyUid === selected.uid}
                    onClick={() => void setMemberActive(selected, true)}
                    className="flex h-11 items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 text-[14px] font-semibold text-emerald-800 hover:bg-emerald-100 disabled:opacity-60"
                  >
                    <UserCheck className="h-4 w-4" />
                    {t("teamHub.reactivate")}
                  </button>
                )}
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
