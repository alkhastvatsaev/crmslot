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
}> = [
  { id: "timeline", icon: Clock, labelKey: "caseHub.section_menu.timeline" },
  { id: "emails", icon: Mail, labelKey: "caseHub.section_menu.emails" },
  { id: "materials", icon: Package, labelKey: "caseHub.section_menu.materials" },
  { id: "billing", icon: Receipt, labelKey: "caseHub.section_menu.billing" },
  { id: "crm", icon: Users, labelKey: "caseHub.section_menu.crm" },
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
    <div
      data-testid="case-hub-section-menu"
      className="shrink-0 border-b border-black/[0.05] bg-white px-3 py-2"
    >
      <p className="mb-2 px-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">
        {t("caseHub.section_menu.title")}
      </p>
      <HubSegmentedControl
        value={safeActive}
        onChange={(id) => onTabChange(id as UnifiedDrawerTab)}
        layout="scroll"
        ariaLabel={String(t("caseHub.section_menu.aria"))}
        options={sections.map(({ id, icon: Icon, labelKey }) => ({
          id,
          label: t(labelKey),
          icon: <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden />,
          testId: `case-hub-section-${id}`,
          badge: badges[id],
          badgeAccent: id === "billing" ? "emerald" : "blue",
          activeAccent: id === "emails" ? "blue" : "blue",
        }))}
      />
    </div>
  );
}
