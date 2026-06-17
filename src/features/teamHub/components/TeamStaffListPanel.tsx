"use client";

import { useEffect, useState } from "react";
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

export default function TeamStaffListPanel({
  companyId,
  staff,
  loading,
  loadError,
  onRefresh,
}: Props) {
  const { t } = useTranslation();
  const [selectedUid, setSelectedUid] = useState<string | null>(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [vehicle, setVehicle] = useState("");

  const { busyUid, error, updateMember, setMemberActive, clearError } = useCompanyStaffActions(
    companyId,
    () => void onRefresh()
  );

  const selected = staff.find((m) => m.uid === selectedUid) ?? null;

  useEffect(() => {
    if (!selectedUid) {
      setFirstName("");
      setLastName("");
      setEmail("");
      setVehicle("");
      return;
    }

    const member = staff.find((m) => m.uid === selectedUid);
    if (!member) return;

    setFirstName(member.firstName);
    setLastName(member.lastName);
    setEmail(member.email ?? "");
    setVehicle(member.vehicle ?? "");
    clearError();
    // Charge le formulaire uniquement au changement de sélection.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedUid]);

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
      className="flex min-h-0 flex-1 flex-col gap-2 overflow-hidden p-2 sm:p-3"
    >
      {loadError ? (
        <div
          role="alert"
          data-testid="team-staff-load-error"
          className="shrink-0 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[12px] text-red-700"
        >
          {loadError}
        </div>
      ) : null}

      {error ? (
        <div
          role="alert"
          data-testid="team-staff-action-error"
          className="shrink-0 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[12px] text-red-700"
        >
          {error}
        </div>
      ) : null}

      <div className="grid min-h-0 flex-1 gap-2 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:grid-rows-1">
        <section className="flex min-h-0 max-h-[42dvh] flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm lg:max-h-none">
          {loading ? (
            <div
              className="flex h-32 items-center justify-center"
              data-testid="team-staff-loading"
              aria-busy="true"
            >
              <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
            </div>
          ) : staff.length === 0 ? (
            <p
              data-testid="team-staff-empty"
              className="px-3 py-8 text-center text-[12px] text-slate-500"
            >
              {t("teamHub.empty")}
            </p>
          ) : (
            <ul
              className="min-h-0 flex-1 divide-y divide-slate-100 overflow-y-auto"
              data-testid="team-staff-list"
            >
              {staff.map((member) => (
                <li key={member.uid}>
                  <button
                    type="button"
                    data-testid={`team-staff-row-${member.uid}`}
                    onClick={() => setSelectedUid(member.uid)}
                    className={`flex w-full items-center gap-2 px-3 py-2.5 text-left transition hover:bg-slate-50 ${
                      selectedUid === member.uid ? "bg-blue-50/70" : ""
                    }`}
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-700">
                      {(member.displayName.trim().charAt(0) || "?").toUpperCase()}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] font-semibold text-slate-900">
                        {member.displayName}
                      </span>
                      <span className="block truncate text-[11px] text-slate-500">
                        {member.email || t("teamHub.no_email")}
                      </span>
                    </span>
                    <span
                      data-testid={`team-staff-status-${member.uid}`}
                      className={`shrink-0 rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide ${
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
          className="flex min-h-0 flex-1 flex-col overflow-y-auto rounded-xl border border-slate-200 bg-white p-3 shadow-sm"
          data-testid="team-staff-detail"
        >
          {!selected ? (
            <p className="m-auto px-2 text-center text-[12px] text-slate-500">
              {t("teamHub.select_member")}
            </p>
          ) : (
            <>
              <h2 className="mb-3 shrink-0 truncate text-[14px] font-semibold text-slate-900">
                {selected.displayName}
              </h2>

              <div className="flex flex-col gap-2">
                <label className="flex flex-col gap-0.5 text-[11px] font-medium text-slate-600">
                  {t("teamHub.fields.first_name")}
                  <input
                    data-testid="team-staff-edit-first-name"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-[13px] text-slate-900"
                  />
                </label>
                <label className="flex flex-col gap-0.5 text-[11px] font-medium text-slate-600">
                  {t("teamHub.fields.last_name")}
                  <input
                    data-testid="team-staff-edit-last-name"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-[13px] text-slate-900"
                  />
                </label>
                <label className="flex flex-col gap-0.5 text-[11px] font-medium text-slate-600">
                  {t("teamHub.fields.email")}
                  <input
                    data-testid="team-staff-edit-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-[13px] text-slate-900"
                  />
                </label>
                <label className="flex flex-col gap-0.5 text-[11px] font-medium text-slate-600">
                  {t("teamHub.fields.vehicle")}
                  <input
                    data-testid="team-staff-edit-vehicle"
                    value={vehicle}
                    onChange={(e) => setVehicle(e.target.value)}
                    className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-[13px] text-slate-900"
                  />
                </label>
              </div>

              <div className="mt-3 flex shrink-0 flex-col gap-2 pb-1">
                <button
                  type="button"
                  data-testid="team-staff-save"
                  disabled={busyUid === selected.uid}
                  onClick={() => void handleSave()}
                  className="flex h-10 items-center justify-center gap-2 rounded-lg bg-blue-600 text-[13px] font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
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
                    className="flex h-10 items-center justify-center gap-2 rounded-lg border border-amber-200 bg-amber-50 text-[13px] font-semibold text-amber-800 hover:bg-amber-100 disabled:opacity-60"
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
                    className="flex h-10 items-center justify-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 text-[13px] font-semibold text-emerald-800 hover:bg-emerald-100 disabled:opacity-60"
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
