import { z } from "zod";

/**
 * Contrat partagé client/server pour `POST /api/ai/chatbot`.
 * Aligné sur `ChatbotPostBody` dans `chatbot-route-handler.ts`.
 */

export const ChatbotCompanyRoleSchema = z.enum(["admin", "collaborateur"]);

export const ChatbotConfirmToolSchema = z.object({
  toolUseId: z.string().min(1).optional(),
  name: z.string().min(1).optional(),
  input: z.record(z.string(), z.unknown()).optional(),
});

export const ChatbotPostRequestSchema = z.object({
  companyId: z.string().min(1).optional(),
  companyName: z.string().optional(),
  role: ChatbotCompanyRoleSchema.nullable().optional(),
  messages: z.array(z.unknown()).optional(),
  workspaceSnapshot: z.unknown().optional(),
  confirmTool: ChatbotConfirmToolSchema.optional(),
  toolScope: z.array(z.string().min(1)).optional(),
  conversationId: z.string().nullable().optional(),
  focusInterventionId: z.string().nullable().optional(),
});

export type ChatbotPostRequest = z.infer<typeof ChatbotPostRequestSchema>;

export const ChatbotPostErrorResponseSchema = z.object({
  error: z.string(),
  issues: z
    .array(
      z.object({
        path: z.array(z.union([z.string(), z.number()])),
        message: z.string(),
      })
    )
    .optional(),
});

export type ChatbotPostErrorResponse = z.infer<typeof ChatbotPostErrorResponseSchema>;
