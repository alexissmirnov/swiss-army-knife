import { tool } from "ai";
import { z } from "zod";

export const timeslotSelect = tool({
  description:
    "Present a list of available appointment slots to the user and ask them to select one.",
  inputSchema: z.object({
    question: z.string().min(1).max(200),
    slots: z.array(z.string().datetime()).min(1),
    resultKey: z.string().min(1).max(80).optional(),
  }),
  execute: async (input) => {
    const question = input.question.trim() || "Choose a time.";
    const resultKey = input.resultKey?.trim().slice(0, 80);
    const slots = input.slots;

    return {
      question,
      slots,
      ...(resultKey ? { resultKey } : {}),
    };
  },
});
