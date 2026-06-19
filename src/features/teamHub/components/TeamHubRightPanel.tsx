"use client";

import { useEffect, useState } from "react";
import { Loader2, Pencil, UserCheck, UserX } from "lucide-react";
import { useTranslation } from "@/core/i18n/I18nContext";
import HubButton from "@/core/ui/hub/HubButton";
import type { CompanyStaffMember } from "@/features/teamHub/types";
import { useCompanyStaffActions } from "@/features/teamHub/hooks/useCompanyStaffActions";

type Props = {
  companyId: string;
  staff: CompanyStaffMember[];
  selectedUid: string | null;
  onClearSelection: () => void;
  onRefresh: () => Promise<void>;
};

export default function TeamHubRightPanel({
  companyId,
  staff,
  selectedUid,
  onClearSelection,
  onRefresh,
}: Props) {
  const { t } = useTranslation();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [vehicle, setVehicle] = useState("");

  const selected = staff.find((m) => m.uid === selectedUid) ?? null;

  const { busyUid, error, updateMember, setMemberActive, clearError } = useCompanyStaffActions(
    companyId,
    () => void onRefresh()
  );

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedUid]);

  if (!selected) {
    return (
      <div
        data-testid="team-staff-detail"
        className="flex min-h-0 flex-1 flex-col items-center justify-center px-6 text-center text-[12px] text-slate-400"
      >
        {t("teamHub.select_member")}
      </div>
    );
  }

  const handleSave = async () => {
    const ok = await updateMember(selected.uid, {
      firstName,
      lastName,
      email: email.trim() || null,
      vehicle: vehicle.trim() || undefined,
    });
    if (ok) onClearSelection();
  };

  return (
    <div
      data-testid="team-staff-detail"
      className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-4"
    >
      {error ? (
        <div
          role="alert"
          data-testid="team-staff-action-error"
          className="shrink-0 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[12px] text-red-700"
        >
          {error}
        </div>
      ) : null}

      <div className="rounded-[24px] border border-black/[0.06] bg-white/95 p-4 text-center">
        <p className="text-lg font-bold text-slate-900">{selected.displayName}</p>
        <p className="mt-1 text-[11px] font-medium uppercase tracking-wide text-slate-500">
          {t(`teamHub.role.${selected.role}`)}
          {selected.hasTechnicianProfile ? ` · ${t("teamHub.technician_badge")}` : ""}
        </p>
      </div>

      <div className="space-y-2 rounded-[20px] border border-black/[0.06] bg-white/95 p-3">
        <input
          data-testid="team-staff-edit-first-name"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          placeholder={t("teamHub.fields.first_name")}
          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
          aria-label={t("teamHub.fields.first_name")}
        />
        <input
          data-testid="team-staff-edit-last-name"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          placeholder={t("teamHub.fields.last_name")}
          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
          aria-label={t("teamHub.fields.last_name")}
        />
        <input
          data-testid="team-staff-edit-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t("teamHub.fields.email")}
          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
          aria-label={t("teamHub.fields.email")}
        />
        <input
          data-testid="team-staff-edit-vehicle"
          value={vehicle}
          onChange={(e) => setVehicle(e.target.value)}
          placeholder={t("teamHub.fields.vehicle")}
          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
          aria-label={t("teamHub.fields.vehicle")}
        />
      </div>

      <div className="mt-auto flex flex-col gap-2">
        <HubButton
          data-testid="team-staff-save"
          fullWidth
          disabled={busyUid === selected.uid}
          onClick={() => void handleSave()}
        >
          {busyUid === selected.uid ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          ) : (
            <Pencil className="h-4 w-4" aria-hidden />
          )}
          {t("teamHub.save")}
        </HubButton>

        {selected.active ? (
          <HubButton
            variant="secondary"
            data-testid="team-staff-deactivate"
            fullWidth
            disabled={busyUid === selected.uid}
            onClick={() => void setMemberActive(selected, false)}
          >
            <UserX className="h-4 w-4" aria-hidden />
            {t("teamHub.deactivate")}
          </HubButton>
        ) : (
          <HubButton
            data-testid="team-staff-reactivate"
            fullWidth
            disabled={busyUid === selected.uid}
            onClick={() => void setMemberActive(selected, true)}
          >
            <UserCheck className="h-4 w-4" aria-hidden />
            {t("teamHub.reactivate")}
          </HubButton>
        )}
      </div>
    </div>
  );
}
