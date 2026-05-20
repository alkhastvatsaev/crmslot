export type CopilotChatRole = "user" | "assistant";

export type CopilotChatMessage = {
  id: string;
  role: CopilotChatRole;
  content: string;
  createdAt: number;
};

export type WorkspaceCopilotClientRow = {
  name: string;
  phone: string | null;
  interventionCount: number;
};

export type WorkspaceCopilotInterventionRow = {
  id: string;
  title: string;
  status: string;
  clientName: string | null;
  address: string | null;
  problem: string | null;
  scheduled: string | null;
  paymentStatus: string | null;
  invoiceAmountEur: number | null;
  urgency: boolean;
  hasAudio: boolean;
  hasInvoicePdf: boolean;
  clientEmail: string | null;
};

export type WorkspaceCopilotSnapshot = {
  generatedAt: string;
  locale: string;
  company: {
    id: string;
    name: string | null;
    role: string | null;
  };
  summary: {
    totalInterventions: number;
    byStatus: Record<string, number>;
    urgentOpen: number;
    awaitingAssignment: number;
    inProgress: number;
    doneOrInvoiced: number;
    unpaidCount: number;
    paidCount: number;
    pendingOfflineQueue: number;
    navigatorOnline: boolean;
  };
  clients: WorkspaceCopilotClientRow[];
  interventions: WorkspaceCopilotInterventionRow[];
};

export type WorkspaceCopilotApiMessage = {
  role: CopilotChatRole;
  content: string;
};
