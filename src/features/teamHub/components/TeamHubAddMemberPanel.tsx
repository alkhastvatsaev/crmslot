"use client";

import { useState } from "react";
import { Check, Copy, Loader2 } from "lucide-react";
import { useTranslation } from "@/core/i18n/I18nContext";
import HubButton from "@/core/ui/hub/HubButton";
import HubSegmentedControl from "@/core/ui/hub/HubSegmentedControl";
import { HUB_FIELD_CLASS, HUB_TYPE } from "@/core/ui/hub/hubTheme";
import type { CompanyStaffKind, CompanyStaffMember } from "@/features/teamHub/types";
import { parseStaffContactInput } from "@/features/teamHub/resolveCompanyStaffKind";
import {
  COMPANY_STAFF_KIND_OPTIONS,
  useCreateCompanyStaff,
  type CreateCompanyStaffResponse,
} from "@/features/teamHub/hooks/useCreateCompanyStaff";

type Props = {
  companyId: string;
  staff: CompanyStaffMember[];
  onCreated?: (result: CreateCompanyStaffResponse) => void | Promise<void>;
};

function suggestStaffKind(staff: CompanyStaffMember[]): CompanyStaffKind {
  const hasTechnician = staff.some((m) => m.hasTechnicianProfile && m.active);
  if (!hasTechnician) return "technician";
  if (staff.length > 0 && staff.every((m) => m.role === "admin")) return "dispatcher";
  return "technician";
}

function resolveCopyPayload(result: CreateCompanyStaffResponse): string | null {
  if (result.mode === "invite") return result.inviteId;
  if (result.mode === "member" && result.passwordResetLink) return result.passwordResetLink;
  return null;
}

export default function TeamHubAddMemberPanel({ companyId, staff, onCreated }: Props) {
  const { t } = useTranslation();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [contact, setContact] = useState("");
  const [staffKind, setStaffKind] = useState<CompanyStaffKind>(() => suggestStaffKind(staff));
  const [copied, setCopied] = useState(false);

  const { busy, error, lastResult, createMember, clearFeedback } = useCreateCompanyStaff(
    companyId,
    onCreated
  );

  const copyPayload = lastResult ? resolveCopyPayload(lastResult) : null;

  const handleSubmit = async () => {
    clearFeedback();
    setCopied(false);
    const { email, phone } = parseStaffContactInput(contact);
    const result = await createMember({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email,
      phone,
      staffKind,
    });
    if (result) {
      setFirstName("");
      setLastName("");
      setContact("");
      setStaffKind(suggestStaffKind(staff));
    }
  };

  const handleCopy = async () => {
    if (!copyPayload || !navigator.clipboard) return;
    try {
      await navigator.clipboard.writeText(copyPayload);
      setCopied(true);
    } catch {
      /* ignore */
    }
  };

  const successLine = !lastResult
    ? null
    : lastResult.mode === "invite"
      ? t("teamHub.add.success_invite_short")
      : lastResult.alreadyMember
        ? t("teamHub.add.success_existing")
        : lastResult.created
          ? t("teamHub.add.success_created_short")
          : t("teamHub.add.success_member");

  return (
    <div
      data-testid="team-hub-add-member-panel"
      className="flex min-h-0 flex-1 flex-col overflow-y-auto px-4 py-5"
    >
      <p className={HUB_TYPE.eyebrow}>{t("teamHub.add.eyebrow")}</p>

      <div className="mt-4 space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <input
            data-testid="team-hub-add-first-name"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder={t("teamHub.fields.first_name")}
            aria-label={t("teamHub.fields.first_name")}
            className={HUB_FIELD_CLASS}
          />
          <input
            data-testid="team-hub-add-last-name"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            placeholder={t("teamHub.fields.last_name")}
            aria-label={t("teamHub.fields.last_name")}
            className={HUB_FIELD_CLASS}
          />
        </div>

        <input
          data-testid="team-hub-add-contact"
          value={contact}
          onChange={(e) => setContact(e.target.value)}
          placeholder={t("teamHub.add.contact_placeholder")}
          aria-label={t("teamHub.add.contact_placeholder")}
          className={HUB_FIELD_CLASS}
        />

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
            testId: `team-hub-add-role-${kind}`,
          }))}
        />

        {error ? (
          <p role="alert" data-testid="team-hub-add-error" className="text-[12px] text-red-600">
            {error}
          </p>
        ) : null}

        {successLine ? (
          <div
            data-testid="team-hub-add-success"
            className="flex items-center justify-between gap-2 rounded-[12px] bg-emerald-50 px-3 py-2 text-[12px] font-medium text-emerald-900"
          >
            <span>{successLine}</span>
            {copyPayload ? (
              <button
                type="button"
                data-testid="team-hub-add-copy"
                onClick={() => void handleCopy()}
                className="inline-flex shrink-0 items-center gap-1 rounded-full bg-white/80 px-2 py-1 text-[11px] font-semibold text-emerald-800"
              >
                {copied ? (
                  <Check className="h-3 w-3" aria-hidden />
                ) : (
                  <Copy className="h-3 w-3" aria-hidden />
                )}
                {copied ? t("teamHub.add.copied") : t("teamHub.add.copy")}
              </button>
            ) : null}
          </div>
        ) : null}

        <HubButton
          data-testid="team-hub-add-submit"
          fullWidth
          disabled={busy || !firstName.trim() || !contact.trim()}
          onClick={() => void handleSubmit()}
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
          {t("teamHub.add.submit")}
        </HubButton>
      </div>
    </div>
  );
}
