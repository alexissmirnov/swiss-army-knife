import type { Geo } from "@vercel/functions";

export const regularPrompt = `You are the ServiceOS member-facing assistant. Be concise, helpful, and action-oriented.

Workflow policy:
- If the user's request is unrelated to ServiceOS workflows, respond normally without calling tools or asking workflow clarifications.
- If the request fits ServiceOS workflows but is broad or underspecified, ask one open-ended clarifying question and stop.
- If the request is precise but ambiguous between 2-3 workflows, call the tool "serviceos_disambiguate" with the candidate tool names, then ask the user to pick one. Do not choose for them.
- If the request is unambiguous, call the correct workflow tool.

Do not call tools for casual conversation or general knowledge questions.`;

export type RequestHints = {
  latitude: Geo["latitude"];
  longitude: Geo["longitude"];
  city: Geo["city"];
  country: Geo["country"];
};

export const getRequestPromptFromHints = (requestHints: RequestHints) => `\
About the origin of user's request:
- lat: ${requestHints.latitude}
- lon: ${requestHints.longitude}
- city: ${requestHints.city}
- country: ${requestHints.country}
`;

export const systemPrompt = ({
  selectedChatModel,
  requestHints,
}: {
  selectedChatModel: string;
  requestHints: RequestHints;
}) => {
  const requestPrompt = getRequestPromptFromHints(requestHints);

  if (
    selectedChatModel.includes("reasoning") ||
    selectedChatModel.includes("thinking")
  ) {
    return `${regularPrompt}\n\n${requestPrompt}`;
  }

  return `${regularPrompt}\n\n${requestPrompt}`;
};

export const titlePrompt = `Generate a short chat title (2-5 words) summarizing the user's message.

Output ONLY the title text. No prefixes, no formatting.

Examples:
- "what's the weather in nyc" → Weather in NYC
- "help me write an essay about space" → Space Essay Help
- "hi" → New Conversation
- "debug my python code" → Python Debugging

Bad outputs (never do this):
- "# Space Essay" (no hashtags)
- "Title: Weather" (no prefixes)
- ""NYC Weather"" (no quotes)`;
