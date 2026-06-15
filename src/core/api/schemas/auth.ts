import { z } from "zod";

/** Identité authentifiée injectée par `requireAuthenticatedUser`. */
export const AuthenticatedUserSchema = z.object({
  uid: z.string().min(1),
  email: z.string().email().optional(),
  emailVerified: z.boolean().optional(),
  token: z
    .object({
      admin: z.boolean().optional(),
      technician: z.boolean().optional(),
      companyId: z.string().optional(),
    })
    .partial()
    .default({}),
});
export type AuthenticatedUser = z.infer<typeof AuthenticatedUserSchema>;
