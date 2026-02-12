export type ChatModel = {
  id: string;
  name: string;
  provider: string;
  description: string;
};

export const DEFAULT_CHAT_MODEL = "gpt-5-mini";

export const chatModels: ChatModel[] = [
  {
    id: "gpt-5-mini",
    name: "GPT-5 Mini",
    provider: "openai",
    description: "Fast and cost-effective for simple prompts",
  },
  {
    id: "gpt-5.2",
    name: "GPT-5.2",
    provider: "openai",
    description: "Higher quality reasoning and responses",
  },
];
