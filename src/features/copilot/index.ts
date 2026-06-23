/**
 * API publique copilot — snapshot workspace et chat SSE léger (≠ chatbot galaxy).
 */
export type {
  CopilotChatRole,
  CopilotChatMessage,
  WorkspaceCopilotClientRow,
  WorkspaceCopilotInterventionRow,
  WorkspaceCopilotSnapshot,
  WorkspaceCopilotApiMessage,
} from "@/features/copilot/types";
export { buildWorkspaceCopilotSnapshot } from "@/features/copilot/buildWorkspaceCopilotSnapshot";
export { useWorkspaceCopilotSnapshot } from "@/features/copilot/hooks/useWorkspaceCopilotSnapshot";
export { default as PwaCopilotChatPanel } from "@/features/copilot/components/PwaCopilotChatPanel";
export { default as PwaCopilotContextSummary } from "@/features/copilot/components/PwaCopilotContextSummary";
export { default as PwaCopilotSuggestions } from "@/features/copilot/components/PwaCopilotSuggestions";
