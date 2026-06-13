import {
  BrainCircuit,
  Building2,
  Mail,
  Map,
  Package,
  Receipt,
  Sparkles,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import type { DashboardCarouselPageDef } from "@/features/dashboard/dashboardCarouselRegistry";

export type DashboardMobileNavIconKey = DashboardCarouselPageDef["spotlightLabelKey"];

export const DASHBOARD_MOBILE_NAV_ICONS: Record<DashboardMobileNavIconKey, LucideIcon> = {
  "spotlight.nav_map": Map,
  "spotlight.nav_company": Building2,
  "spotlight.nav_technician": Wrench,
  "spotlight.nav_gmail": Mail,
  "spotlight.nav_feature_hub": Package,
  "spotlight.nav_crm_history": Sparkles,
  "spotlight.nav_billing_hub": Receipt,
  "spotlight.nav_offline": BrainCircuit,
};

export type MobileHubRail = "left" | "center" | "right";

export const MOBILE_HUB_RAILS: readonly MobileHubRail[] = ["left", "center", "right"] as const;

export const MOBILE_HUB_RAIL_I18N: Record<MobileHubRail, string> = {
  left: "mobile.rail_left",
  center: "mobile.rail_center",
  right: "mobile.rail_right",
};

export const MOBILE_TAB_I18N: Record<DashboardMobileNavIconKey, string> = {
  "spotlight.nav_map": "mobile.tab_map",
  "spotlight.nav_company": "mobile.tab_company",
  "spotlight.nav_technician": "mobile.tab_technician",
  "spotlight.nav_gmail": "mobile.tab_gmail",
  "spotlight.nav_feature_hub": "mobile.tab_material",
  "spotlight.nav_crm_history": "mobile.tab_crm",
  "spotlight.nav_billing_hub": "mobile.tab_billing",
  "spotlight.nav_offline": "mobile.tab_ai",
};
