"use client";

import { useEffect, useState } from "react";
import { Loader2, Pencil, Trash2, UserCheck, UserX } from "lucide-react";
import { useTranslation } from "@/core/i18n/I18nContext";
import HubButton from "@/core/ui/hub/HubButton";
import HubSegmentedControl from "@/core/ui/hub/HubSegmentedControl";
import type { CompanyStaffKind, CompanyStaffMember } from "@/features/teamHub/types";
import { resolveCompanyStaffKind } from "@/features/teamHub/resolveCompanyStaffKind";
import { useCompanyStaffActions } from "@/features/teamHub/hooks/useCompanyStaffActions";
import { COMPANY_STAFF_KIND_OPTIONS } from "@/features/teamHub/hooks/useCreateCompanyStaff";

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
  const [staffKind, setStaffKind] = useState<CompanyStaffKind>("technician");

  const selected = staff.find((m) => m.uid === selectedUid) ?? null;

  const { busyUid, error, updateMember, setMemberActive, deleteMember, clearError } =
    useCompanyStaffActions(companyId, () => void onRefresh());

  useEffect(() => {
    if (!selected) {
      setFirstName("");
      setLastName("");
      setEmail("");
      setVehicle("");
      setStaffKind("technician");
      return;
    }
    setFirstName(selected.firstName);
    setLastName(selected.lastName);
    setEmail(selected.email ?? "");
    setVehicle(selected.vehicle ?? "");
    setStaffKind(resolveCompanyStaffKind(selected));
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
      staffKind,
    });
    if (ok) onClearSelection();
  };

  const handleDelete = async () => {
    const confirmed = window.confirm(String(t("teamHub.delete_account_confirm")));
    if (!confirmed) return;
    const ok = await deleteMember(selected.uid);
    if (ok) onClearSelection();
  };

  return (
    <div data-testid="team-staff-detail" className="flex min-h-0 flex-1 flex-col gap-3 p-4">
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
      </div>

      <HubSegmentedControl
        value={staffKind}
        onChange={(id) => setStaffKind(id as CompanyStaffKind)}
        ariaLabel={t("teamHub.add.role_label")}
        layout="scroll"
        size="compact"
        options={COMPANY_STAFF_KIND_OPTIONS.map((kind) => ({
          id: kind,
          label: t(`teamHub.staff_kind_short.${kind}`),
          title: t(`teamHub.staff_kind.${kind}`),
          testId: `team-staff-edit-role-${kind}`,
        }))}
      />

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

        <button
          type="button"
          data-testid="team-staff-delete-account"
          disabled={busyUid === selected.uid}
          onClick={() => void handleDelete()}
          className="mx-auto inline-flex min-h-[32px] items-center justify-center gap-1.5 px-2 text-[12px] font-semibold text-red-600 transition-colors hover:text-red-700 disabled:opacity-50"
        >
          {busyUid === selected.uid ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
          ) : (
            <Trash2 className="h-3.5 w-3.5 shrink-0" aria-hidden />
          )}
          {t("teamHub.delete_account")}
        </button>
      </div>
    </div>
  );
}
