"use client";

import { useMemo } from "react";
import { Clock, Mail, Package, Receipt, Users } from "lucide-react";
import { useTranslation } from "@/core/i18n/I18nContext";
import { useFeatureFlag } from "@/core/useFeatureFlags";
import { HubSegmentedControl } from "@/core/ui/hub";
import { useInterventionEmails } from "@/features/emails/useInterventionEmails";
import type { UnifiedDrawerTab } from "@/features/interventions/components/UnifiedInterventionDrawer";

const SECTIONS: Array<{
  id: UnifiedDrawerTab;
  icon: typeof Mail;
  labelKey: string;
  shortLabelKey: string;
}> = [
  {
    id: "timeline",
    icon: Clock,
    labelKey: "caseHub.section_menu.timeline",
    shortLabelKey: "caseHub.section_menu.short_timeline",
  },
  {
    id: "emails",
    icon: Mail,
    labelKey: "caseHub.section_menu.emails",
    shortLabelKey: "caseHub.section_menu.short_emails",
  },
  {
    id: "materials",
    icon: Package,
    labelKey: "caseHub.section_menu.materials",
    shortLabelKey: "caseHub.section_menu.short_materials",
  },
  {
    id: "billing",
    icon: Receipt,
    labelKey: "caseHub.section_menu.billing",
    shortLabelKey: "caseHub.section_menu.short_billing",
  },
  {
    id: "crm",
    icon: Users,
    labelKey: "caseHub.section_menu.crm",
    shortLabelKey: "caseHub.section_menu.short_crm",
  },
];

type Props = {
  interventionId: string;
  activeTab: UnifiedDrawerTab;
  onTabChange: (tab: UnifiedDrawerTab) => void;
  tabBadges?: Partial<Record<UnifiedDrawerTab, number>>;
};

export default function CaseHubDetailSectionMenu({
  interventionId,
  activeTab,
  onTabChange,
  tabBadges,
}: Props) {
  const { t } = useTranslation();
  const crmEnabled = useFeatureFlag("crmContacts");
  const { unreadCount } = useInterventionEmails(interventionId);

  const sections = useMemo(
    () => (crmEnabled ? SECTIONS : SECTIONS.filter((s) => s.id !== "crm")),
    [crmEnabled]
  );

  const badges = useMemo(() => {
    const merged = { ...tabBadges };
    if (unreadCount > 0) merged.emails = unreadCount;
    return merged;
  }, [tabBadges, unreadCount]);

  const safeActive = sections.some((s) => s.id === activeTab) ? activeTab : "timeline";

  return (
    <div data-testid="case-hub-section-menu">
      <HubSegmentedControl
        value={safeActive}
        onChange={(id) => onTabChange(id as UnifiedDrawerTab)}
        layout="scroll"
        size="compact"
        ariaLabel={String(t("caseHub.section_menu.aria"))}
        className="w-full gap-1.5 rounded-[16px] bg-slate-100/80 p-1 ring-1 ring-inset ring-slate-200/60"
        options={sections.map(({ id, icon: Icon, labelKey, shortLabelKey }) => ({
          id,
          label: t(shortLabelKey as "caseHub.section_menu.short_timeline"),
          title: String(t(labelKey)),
          icon: <Icon className="h-3.5 w-3.5 shrink-0 opacity-80" aria-hidden />,
          testId: `case-hub-section-${id}`,
          badge: badges[id],
          badgeAccent: "slate",
          activeAccent: "slate",
        }))}
      />
    </div>
  );
}
