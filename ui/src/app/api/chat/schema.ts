import { z } from "zod";

export const postRequestBodySchema = z.object({
  messages: z.array(z.any()).default([]),
  selectedChatModel: z.string().optional(),
});

export type PostRequestBody = z.infer<typeof postRequestBodySchema>;
