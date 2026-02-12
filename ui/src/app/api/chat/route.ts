import {
  convertToModelMessages,
  createUIMessageStream,
  createUIMessageStreamResponse,
  generateId,
  streamText,
} from "ai";
import { DEFAULT_CHAT_MODEL } from "@/lib/ai/models";
import { systemPrompt } from "@/lib/ai/prompts";
import { getLanguageModel } from "@/lib/ai/providers";
import { postRequestBodySchema } from "./schema";

export async function POST(request: Request) {
  let requestBody: ReturnType<typeof postRequestBodySchema.parse>;

  try {
    const json = await request.json();
    requestBody = postRequestBodySchema.parse(json);
  } catch (_error) {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }

  const selectedChatModel =
    requestBody.selectedChatModel ?? DEFAULT_CHAT_MODEL;
  const uiMessages = requestBody.messages ?? [];

  const modelMessages = await convertToModelMessages(uiMessages);

  const stream = createUIMessageStream({
    execute: ({ writer }) => {
      const result = streamText({
        model: getLanguageModel(selectedChatModel),
        system: systemPrompt({ selectedChatModel }),
        messages: modelMessages,
      });

      writer.merge(result.toUIMessageStream({ sendReasoning: true }));
    },
    generateId,
  });

  return createUIMessageStreamResponse({ stream });
}
