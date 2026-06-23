import { diagnoseEquipmentPhoto } from "@/features/chatbot/chatbot-vision";
import { parseVoiceJobClosure } from "@/features/chatbot/chatbot-voice-closure";
import { computeContractChurnRisks } from "@/features/clients/contractChurnRisk";
import { fetchInterventionsForCompany } from "@/features/chatbot/chatbot-intervention-source";
import { db } from "@/features/chatbot/chatbot-executor-queries";
import type { ChatbotToolContext } from "@/features/chatbot/chatbot-tool-executor-context";

export async function tryExecuteChatbotAiTool(
  name: string,
  input: Record<string, unknown>,
  ctx: ChatbotToolContext
): Promise<unknown | null> {
  switch (name) {
    case "diagnose_equipment_photo": {
      const apiKey = ctx.openAIApiKey ?? process.env.OPENAI_API_KEY ?? "";
      if (!apiKey) return { error: "OPENAI_API_KEY manquante" };
      return diagnoseEquipmentPhoto({
        photoUrl: String(input.photoUrl ?? ""),
        description: input.description ? String(input.description) : undefined,
        apiKey,
        modelName: ctx.openAIModelName,
      });
    }
    case "parse_voice_job_closure": {
      const apiKey = ctx.openAIApiKey ?? process.env.OPENAI_API_KEY ?? "";
      if (!apiKey) return { error: "OPENAI_API_KEY manquante" };
      return parseVoiceJobClosure({
        transcription: String(input.transcription ?? ""),
        apiKey,
        modelName: ctx.openAIModelName,
      });
    }
    case "get_contract_churn_risks": {
      const firestore = db();
      const [contractsSnap, interventions] = await Promise.all([
        firestore
          .collection("companies")
          .doc(ctx.companyId)
          .collection("maintenanceContracts")
          .where("isActive", "==", true)
          .limit(100)
          .get(),
        fetchInterventionsForCompany(firestore, ctx.companyId, 500),
      ]);
      const contracts = contractsSnap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as unknown as import("@/features/maintenance/types").MaintenanceContract[];
      const risks = computeContractChurnRisks(
        contracts,
        interventions as unknown as import("@/features/interventions/types").Intervention[]
      );
      const filter = String(input.riskLevelFilter ?? "all");
      const filtered = filter === "all" ? risks : risks.filter((r) => r.riskLevel === filter);
      return {
        total: risks.length,
        filtered: filtered.length,
        risks: filtered.slice(0, 20),
        summary: {
          at_risk: risks.filter((r) => r.riskLevel === "at_risk").length,
          watch: risks.filter((r) => r.riskLevel === "watch").length,
          safe: risks.filter((r) => r.riskLevel === "safe").length,
        },
      };
    }
    case "trigger_accounting_export":
      return { ok: true, exportType: "accounting" };
    case "trigger_payroll_export":
      return { ok: true, exportType: "payroll" };
    default:
      return null;
  }
}
