import { openai } from "@ai-sdk/openai";

export function getLanguageModel(modelId: string) {
  return openai(modelId);
}
