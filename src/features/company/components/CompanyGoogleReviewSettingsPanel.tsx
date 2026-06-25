"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { Star } from "lucide-react";
import { toast } from "sonner";
import { firestore } from "@/core/config/firebase";
import { useCompanyWorkspaceOptional } from "@/context/CompanyWorkspaceContext";
import { useTranslation } from "@/core/i18n/I18nContext";
import { useFeatureFlag } from "@/core/useFeatureFlags";
import {
  COMPANY_SPACE_GLASS_ROW,
  COMPANY_SPACE_ICON_RAIL,
  COMPANY_SPACE_INPUT_CLASS,
} from "@/features/company/companySpacePanelChrome";
import { DEFAULT_GOOGLE_REVIEW_DELAY_HOURS } from "@/features/notifications/googleReviewRequest";

type ReviewFields = {
  enabled: boolean;
  placeId: string;
  reviewUrl: string;
};

const EMPTY: ReviewFields = {
  enabled: false,
  placeId: "",
  reviewUrl: "",
};

function readNestedReview(data: Record<string, unknown>): ReviewFields {
  const nested =
    data.googleReview && typeof data.googleReview === "object"
      ? (data.googleReview as Record<string, unknown>)
      : null;

  return {
    enabled: nested ? nested.enabled === true : data.googleReviewEnabled === true,
    placeId: String(nested?.placeId ?? data.googlePlaceId ?? ""),
    reviewUrl: String(nested?.reviewUrl ?? data.googleReviewUrl ?? ""),
  };
}

function parseGoogleLinkInput(raw: string): { placeId: string; reviewUrl: string } {
  const value = raw.trim();
  if (!value) return { placeId: "", reviewUrl: "" };
  if (/^https?:\/\//i.test(value)) return { placeId: "", reviewUrl: value };
  return { placeId: value, reviewUrl: "" };
}

function displayLinkInput(fields: ReviewFields): string {
  return fields.reviewUrl.trim() || fields.placeId.trim();
}

export default function CompanyGoogleReviewSettingsPanel() {
  const { t } = useTranslation();
  const featureEnabled = useFeatureFlag("googleReviewRequest");
  const workspace = useCompanyWorkspaceOptional();
  const companyId = workspace?.activeCompanyId?.trim() ?? "";
  const isAdmin = workspace?.activeRole === "admin";

  const [fields, setFields] = useState<ReviewFields>(EMPTY);
  const [linkInput, setLinkInput] = useState("");
  const [saving, setSaving] = useState(false);
  const fieldsRef = useRef(fields);
  fieldsRef.current = fields;

  useEffect(() => {
    if (!firestore || !companyId) return;
    void getDoc(doc(firestore, "companies", companyId)).then((snap) => {
      if (!snap.exists()) return;
      const next = readNestedReview(snap.data() as Record<string, unknown>);
      setFields(next);
      setLinkInput(displayLinkInput(next));
    });
  }, [companyId]);

  const persist = useCallback(
    async (next: ReviewFields) => {
      if (!firestore || !companyId || !isAdmin) return false;

      const placeId = next.placeId.trim();
      const reviewUrl = next.reviewUrl.trim();
      if (next.enabled && !placeId && !reviewUrl) {
        toast.error(String(t("company.google_review_need_link")));
        return false;
      }

      setSaving(true);
      try {
        await updateDoc(doc(firestore, "companies", companyId), {
          googleReview: {
            enabled: next.enabled,
            placeId: placeId || null,
            reviewUrl: reviewUrl || null,
            trigger: "paid",
            delayHours: DEFAULT_GOOGLE_REVIEW_DELAY_HOURS,
          },
          googleReviewEnabled: next.enabled,
          googlePlaceId: placeId || null,
          googleReviewUrl: reviewUrl || null,
          googleReviewTrigger: "paid",
          googleReviewDelayHours: DEFAULT_GOOGLE_REVIEW_DELAY_HOURS,
        });
        setFields(next);
        toast.success(String(t("company.google_review_saved")));
        return true;
      } catch {
        toast.error(String(t("common.error")));
        return false;
      } finally {
        setSaving(false);
      }
    },
    [companyId, isAdmin, t]
  );

  const handleToggle = () => {
    if (!isAdmin || saving) return;
    const next = { ...fieldsRef.current, enabled: !fieldsRef.current.enabled };
    void persist(next);
  };

  const handleLinkBlur = () => {
    if (!isAdmin || saving) return;
    const parsed = parseGoogleLinkInput(linkInput);
    const next = { ...fieldsRef.current, ...parsed };
    if (
      next.placeId === fieldsRef.current.placeId &&
      next.reviewUrl === fieldsRef.current.reviewUrl
    ) {
      return;
    }
    void persist(next);
  };

  if (!featureEnabled || !companyId) return null;

  return (
    <div data-testid="company-google-review-settings-panel" className="shrink-0 space-y-2">
      <div className={COMPANY_SPACE_GLASS_ROW}>
        <span className={COMPANY_SPACE_ICON_RAIL}>
          <Star className="h-5 w-5 text-amber-500" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-black">{t("company.google_review_title")}</p>
          <p className="text-[11px] font-medium text-slate-500">
            {t("company.google_review_subtitle")}
          </p>
        </div>
        {isAdmin ? (
          <button
            type="button"
            role="switch"
            aria-checked={fields.enabled}
            aria-label={t("company.google_review_title")}
            data-testid="google-review-enabled"
            disabled={saving}
            onClick={handleToggle}
            className={`relative h-6 w-11 shrink-0 rounded-full transition ${fields.enabled ? "bg-emerald-500" : "bg-slate-300"}`}
          >
            <span
              className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition ${fields.enabled ? "left-5" : "left-0.5"}`}
            />
          </button>
        ) : (
          <span
            data-testid="google-review-status"
            className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${fields.enabled ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-500"}`}
          >
            {fields.enabled ? t("company.google_review_on") : t("company.google_review_off")}
          </span>
        )}
      </div>

      {fields.enabled ? (
        <div className={COMPANY_SPACE_GLASS_ROW}>
          <input
            data-testid="google-review-link"
            value={linkInput}
            onChange={(e) => setLinkInput(e.target.value)}
            onBlur={handleLinkBlur}
            placeholder={String(t("company.google_review_link_placeholder"))}
            disabled={!isAdmin || saving}
            className={COMPANY_SPACE_INPUT_CLASS}
          />
        </div>
      ) : null}
    </div>
  );
}
