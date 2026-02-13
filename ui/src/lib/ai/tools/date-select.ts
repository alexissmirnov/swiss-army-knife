import { tool } from "ai";
import { z } from "zod";

const datePattern = /^\d{4}-\d{2}-\d{2}$/;

const dateSchema = z.string().min(1).max(10).optional();

export const dateSelect = tool({
  description:
    "Ask the user to pick a single date and return it in YYYY-MM-DD format.",
  inputSchema: z.object({
    question: z.string().min(1).max(200),
    resultKey: z.string().min(1).max(80).optional(),
    min: dateSchema,
    max: dateSchema,
    default: dateSchema,
  }),
  execute: async (input) => {
    const question = input.question.trim() || "Choose a date.";
    const resultKey = input.resultKey?.trim().slice(0, 80);

    const min = normalizeDate(input.min);
    const max = normalizeDate(input.max);
    const defaultDate = normalizeDate(input.default);

    return {
      question,
      ...(resultKey ? { resultKey } : {}),
      ...(min ? { min } : {}),
      ...(max ? { max } : {}),
      ...(defaultDate ? { default: defaultDate } : {}),
    };
  },
});

function normalizeDate(value?: string) {
  if (!value) {
    return undefined;
  }
  const trimmed = value.trim().slice(0, 10);
  if (!datePattern.test(trimmed)) {
    return undefined;
  }
  return trimmed;
}
