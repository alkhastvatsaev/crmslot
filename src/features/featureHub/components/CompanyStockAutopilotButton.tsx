"use client";

import { useState } from "react";
import { CheckCircle2, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { firestore } from "@/core/config/firebase";
import { useTranslation } from "@/core/i18n/I18nContext";
import { useDashboardPagerOptional } from "@/features/dashboard/dashboardPagerContext";
import { navigateToChatbotWithPrompt } from "@/features/featureHub/companyStockChatbot";
import { runStockAutopilotPlan } from "@/features/featureHub/companyStockAutopilotRun";
import type { StockAutopilotPlan } from "@/features/featureHub/companyStockAutopilot";

const outfit = { fontFamily: "'Outfit', sans-serif" } as const;

type Props = {
  plan: StockAutopilotPlan;
  onDemoOrderApproved?: (orderId: string) => void;
  compact?: boolean;
  /** Icône + badge uniquement (panneau less-is-more). */
  iconOnly?: boolean;
};

/** Action principale — vitrine dans le panneau central. */
export default function CompanyStockAutopilotButton({
  plan,
  onDemoOrderApproved,
  compact = false,
  iconOnly = false,
}: Props) {
  const { t } = useTranslation();
  const pager = useDashboardPagerOptional();
  const [running, setRunning] = useState(false);
  const hasWork = plan.issueCount > 0;

  const handlePrimary = async () => {
    if (running) return;
    setRunning(true);
    try {
      const { approved } = await runStockAutopilotPlan(firestore, plan, pager, {
        onDemoOrderApproved,
      });
      if (approved > 0) {
        toast.success(`${approved} ${t("companyStock.autopilot_approved_toast")}`);
      }
      if (plan.sendChatbot) {
        toast.message(t("companyStock.autopilot_chatbot_toast"));
      } else if (plan.chatbotPrompt) {
        navigateToChatbotWithPrompt(pager, plan.chatbotPrompt, "draft");
      }
    } catch {
      toast.error(t("common.error"));
    } finally {
      setRunning(false);
    }
  };

  const label = `${t(plan.labelKey)}${plan.issueCount > 0 ? ` (${plan.issueCount})` : ""}`;

  return (
    <button
      type="button"
      data-testid="company-stock-autopilot-primary"
      disabled={running}
      title={label}
      aria-label={label}
      onClick={() => void handlePrimary()}
      style={outfit}
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center rounded-[14px] font-semibold transition",
        iconOnly ? "h-10 w-10" : compact ? "gap-2 px-3 py-2 text-[12px]" : "gap-2 px-4 py-2.5 text-[13px]",
        hasWork
          ? "bg-slate-800 text-white shadow-sm hover:bg-slate-700"
          : "border border-teal-200/90 bg-teal-600 text-white hover:bg-teal-500 shadow-sm shadow-teal-900/10",
        running && "opacity-70",
      )}
    >
      {running ? (
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
      ) : hasWork ? (
        <Sparkles className="h-4 w-4" aria-hidden />
      ) : (
        <CheckCircle2 className="h-4 w-4" aria-hidden />
      )}
      {!iconOnly ? <span>{label}</span> : null}
      {iconOnly && plan.issueCount > 0 ? (
        <span className="absolute -top-1 -right-1 min-w-[18px] rounded-full bg-white px-1 py-0.5 text-center text-[9px] font-bold text-slate-900 tabular-nums">
          {plan.issueCount}
        </span>
      ) : null}
    </button>
  );
}
