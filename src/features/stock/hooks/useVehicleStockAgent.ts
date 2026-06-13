"use client";

import { useMemo } from "react";
import { useHubAgentStreamHandler } from "@/features/hubAgents/handleHubAgentStreamEvent";
import { useHubAgent } from "@/features/hubAgents/useHubAgent";
import { useCompanyWorkspaceOptional } from "@/context/CompanyWorkspaceContext";
import { useTranslation } from "@/core/i18n/I18nContext";

const STORAGE_KEY = "belmap-vehicle-stock-agent-v1";

const VEHICLE_STOCK_RE =
  /stock|article|quantit|pièce|piece|utilisé|utilise|recharg|ajout|reste|j'ai\s+(?:pris|mis|posé|pose)|cylindre|serrure|perceuse|tournevis|visseur|meuleuse/i;

function isVehicleStockAgentInScope(text: string): boolean {
  return !text.trim() || VEHICLE_STOCK_RE.test(text.trim());
}

type Options = {
  enabled?: boolean;
};

export function useVehicleStockAgent({ enabled = true }: Options = {}) {
  const { t } = useTranslation();
  const workspace = useCompanyWorkspaceOptional();
  const companyId = workspace?.activeCompanyId?.trim() ?? "";

  const onStreamEvent = useHubAgentStreamHandler({ companyId });

  const offTopicSuggestions = useMemo(
    () => ["Quel est mon stock actuel ?", "Articles en rupture ?", "J'ai utilisé 1 cylindre"],
    []
  );

  return useHubAgent({
    storageKey: STORAGE_KEY,
    apiPath: "/api/ai/vehicle-stock-agent",
    idPrefix: "vs",
    companyId,
    enabled: enabled && Boolean(companyId),
    isInScope: isVehicleStockAgentInScope,
    offTopicText: String(t("stock.agent_off_topic") ?? "Je gère uniquement le stock véhicule."),
    offTopicSuggestions,
    buildRequestBody: ({ companyId: cid, companyName, messages }) => ({
      companyId: cid,
      companyName,
      messages,
    }),
    onStreamEvent,
  });
}
