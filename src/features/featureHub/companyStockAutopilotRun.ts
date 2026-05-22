import type { Firestore } from "firebase/firestore";
import type { DashboardPagerApi } from "@/features/dashboard/dashboardPagerContext";
import { isDemoMaterialOrderId } from "@/features/dev/demoCompanyStock";
import { navigateToChatbotWithPrompt } from "@/features/featureHub/companyStockChatbot";
import type { StockAutopilotPlan } from "@/features/featureHub/companyStockAutopilot";
import { updateMaterialOrderStatus } from "@/features/materials/materialOrderFirestore";

export async function runStockAutopilotPlan(
  db: Firestore | null | undefined,
  plan: StockAutopilotPlan,
  pager: DashboardPagerApi | null | undefined,
  opts?: { onDemoOrderApproved?: (orderId: string) => void },
): Promise<{ approved: number }> {
  let approved = 0;
  if (plan.orderIdsToApprove.length > 0) {
    await Promise.all(
      plan.orderIdsToApprove.map(async (id) => {
        if (isDemoMaterialOrderId(id)) {
          opts?.onDemoOrderApproved?.(id);
          return;
        }
        if (db) await updateMaterialOrderStatus(db, id, "ordered");
      }),
    );
    approved = plan.orderIdsToApprove.length;
  }
  if (plan.chatbotPrompt && plan.sendChatbot) {
    navigateToChatbotWithPrompt(pager, plan.chatbotPrompt, "send");
  } else if (plan.chatbotPrompt && !plan.sendChatbot) {
    navigateToChatbotWithPrompt(pager, plan.chatbotPrompt, "draft");
  }
  return { approved };
}
