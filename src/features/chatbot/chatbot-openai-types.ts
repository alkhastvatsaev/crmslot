export type OpenAIRunResult =
  | {
      status: "done";
      apiMessages: import("@/features/chatbot/chatbot-stored-messages").ChatbotStoredMessage[];
    }
  | {
      status: "pending";
      apiMessages: import("@/features/chatbot/chatbot-stored-messages").ChatbotStoredMessage[];
      pending: {
        toolUseId: string;
        name: string;
        input: Record<string, unknown>;
        summary: string;
      };
    };
