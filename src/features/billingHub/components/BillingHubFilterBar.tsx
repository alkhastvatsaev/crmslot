"use client";

import { useTranslation } from "@/core/i18n/I18nContext";
import { HUB_FONT_OUTFIT, HubFilterChips } from "@/core/ui/hub";
import type {
  BillingHubMetrics,
  BillingPaymentFilter,
} from "@/features/billingHub/billingHubMetrics";

const FILTERS: { id: BillingPaymentFilter; labelKey: string; countKey: keyof BillingHubMetrics }[] =
  [
    { id: "all", labelKey: "billingHub.filter_all", countKey: "total" },
    { id: "unpaid", labelKey: "billingHub.filter_unpaid", countKey: "unpaid" },
    { id: "pending", labelKey: "billingHub.filter_pending", countKey: "pending" },
    { id: "paid", labelKey: "billingHub.filter_paid", countKey: "paid" },
    { id: "to_bill", labelKey: "billingHub.filter_to_bill", countKey: "toBill" },
  ];

type Props = {
  metrics: BillingHubMetrics;
  activeFilter: BillingPaymentFilter;
  onFilterChange: (f: BillingPaymentFilter) => void;
};

export default function BillingHubFilterBar({ metrics, activeFilter, onFilterChange }: Props) {
  const { t } = useTranslation();

  return (
    <div data-testid="billing-hub-filter-bar" style={HUB_FONT_OUTFIT}>
      <HubFilterChips
        value={activeFilter}
        onChange={(id) => onFilterChange(id as BillingPaymentFilter)}
        ariaLabel={String(t("billingHub.title"))}
        options={FILTERS.map((f) => ({
          id: f.id,
          label: t(f.labelKey),
          count: metrics[f.countKey] as number,
          testId: `billing-hub-filter-${f.id}`,
        }))}
      />
    </div>
  );
}
