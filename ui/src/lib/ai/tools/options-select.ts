import { tool } from "ai";
import { z } from "zod";

const optionSchema = z.object({
  id: z.string().min(1).max(80).optional(),
  title: z.string().min(1).max(140),
  value: z.string().min(1).max(2000).optional(),
  description: z.string().max(200).optional(),
});

export const optionsSelect = tool({
  description:
    "Present a list of options for the user to choose from and return the selected text.",
  inputSchema: z.object({
    question: z.string().min(1).max(200),
    options: z.array(optionSchema).min(2).max(12),
  }),
  execute: async (input) => {
    const question = input.question.trim() || "Choose an option.";

    const normalizedOptions = input.options
      .map((option, index) => {
        const title = option.title.trim();
        if (!title) {
          return null;
        }
        const value = (option.value ?? title).trim();
        if (!value) {
          return null;
        }
        const id = (option.id ?? `option-${index + 1}`).trim();
        const description = option.description?.trim();

        return {
          id: id.slice(0, 80),
          title: title.slice(0, 140),
          value: value.slice(0, 2000),
          ...(description ? { description: description.slice(0, 200) } : {}),
        };
      })
      .filter((option): option is NonNullable<typeof option> => Boolean(option))
      .slice(0, 12);

    return {
      question,
      options: normalizedOptions,
    };
  },
});
