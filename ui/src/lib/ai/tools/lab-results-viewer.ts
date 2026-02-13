import { tool } from "ai";
import { z } from "zod";

export const labResultsViewer = tool({
  description:
    "Display lab results in a rich viewer with tables and trend charts.",
  inputSchema: z.object({
    results: z.array(
      z.object({
        test: z.string(),
        value: z.string(),
        date: z.string(),
        unit: z.string().optional(),
        range: z.string().optional(),
      })
    ),
    title: z.string().optional(),
  }),
  execute: async (input) => {
    return {
      results: input.results,
      title: input.title || "Lab Results",
    };
  },
});
