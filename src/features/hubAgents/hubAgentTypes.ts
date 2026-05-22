export type HubAgentMessage = {
  id: string;
  role: "user" | "assistant";
  text: string;
  suggestions?: string[];
};

export type HubAgentBridgeHandlers = {
  sendMessage: (text: string) => void;
  resetConversation?: () => void;
  disabled: boolean;
};
