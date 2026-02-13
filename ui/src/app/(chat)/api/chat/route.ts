import { geolocation } from "@vercel/functions";
import {
  convertToModelMessages,
  createUIMessageStream,
  createUIMessageStreamResponse,
  generateId,
  hasToolCall,
  stepCountIs,
  streamText,
} from "ai";
import type { UIMessage } from "ai";
import { createMCPClient } from "@ai-sdk/mcp";
import { after } from "next/server";
import { createResumableStreamContext } from "resumable-stream";
import { getServerSession } from "@/lib/auth";
import { DEFAULT_CHAT_MODEL } from "@/lib/ai/models";
import { type RequestHints, systemPrompt } from "@/lib/ai/prompts";
import { getLanguageModel } from "@/lib/ai/providers";
import { dateSelect } from "@/lib/ai/tools/date-select";
import { optionsSelect } from "@/lib/ai/tools/options-select";
import { isProductionEnvironment } from "@/lib/constants";
import {
  createStreamId,
  deleteChatById,
  getChatById,
  getMessagesByChatId,
  saveChat,
  saveMessages,
  updateChatTitleById,
  updateMessage,
} from "@/db/queries";
import type { DBMessage } from "@/db/schema";
import { ChatSDKError } from "@/lib/errors";
import type { ChatMessage } from "@/lib/types";
import { convertToUIMessages, generateUUID, getTextFromMessage } from "@/lib/utils";
import { generateTitleFromUserMessage } from "../../actions";
import { type PostRequestBody, postRequestBodySchema } from "./schema";

export const maxDuration = 60;

type ConfidenceToolEntry = {
  name: string;
  mcp_name?: string;
  confidence: number;
};

type ConfidenceEvalResult = {
  threshold?: number;
  selected?: ConfidenceToolEntry | null;
  tools?: ConfidenceToolEntry[];
  top_k?: number;
  mode?: string;
};

const CONFIDENCE_TOOL_NAME = "meta-confidence-eval";

function extractConfidencePayload(result: unknown): ConfidenceEvalResult | null {
  if (!result || typeof result !== "object") {
    return null;
  }
  const structured = (result as { structuredContent?: unknown }).structuredContent;
  if (!structured || typeof structured !== "object") {
    return null;
  }
  return structured as ConfidenceEvalResult;
}

function buildActiveTools(
  tools: Record<string, unknown>,
  confidenceEval: ConfidenceEvalResult | null
): string[] {
  const allTools = Object.keys(tools);
  if (!confidenceEval?.tools || confidenceEval.tools.length === 0) {
    return allTools;
  }

  const threshold =
    typeof confidenceEval.threshold === "number" ? confidenceEval.threshold : 0;
  const topK =
    typeof confidenceEval.top_k === "number" && confidenceEval.top_k > 0
      ? confidenceEval.top_k
      : 5;

  const ranked = [...confidenceEval.tools].sort(
    (left, right) => right.confidence - left.confidence
  );
  const above = ranked.filter((tool) => tool.confidence >= threshold);
  const chosen = (above.length > 0 ? above : ranked.slice(0, topK)).map(
    (tool) => tool.mcp_name ?? `tool-${tool.name}`
  );
  const allowed = new Set([...chosen, "options-select", "date-select"]);
  return Array.from(allowed).filter((name) => name in tools);
}

function getStreamContext() {
  try {
    return createResumableStreamContext({ waitUntil: after });
  } catch (_) {
    return null;
  }
}

export { getStreamContext };

export async function POST(request: Request) {
  let requestBody: PostRequestBody;

  try {
    const json = await request.json();
    requestBody = postRequestBodySchema.parse(json);
  } catch (_) {
    return new ChatSDKError("bad_request:api").toResponse();
  }

  try {
    const {
      id,
      message,
      messages,
      selectedChatModel: selectedChatModelRaw,
      selectedVisibilityType,
    } = requestBody;

    const session = await getServerSession();

    if (!session?.user) {
      return new ChatSDKError("unauthorized:chat").toResponse();
    }

    if (!process.env.OPENAI_API_KEY) {
      return new ChatSDKError("bad_request:activate_gateway").toResponse();
    }

    const mcpUrl = process.env.SERVICEOS_MCP_URL;
    if (!mcpUrl) {
      return new ChatSDKError("bad_request:api").toResponse();
    }

    const selectedChatModel = selectedChatModelRaw ?? DEFAULT_CHAT_MODEL;
    const isToolApprovalFlow = Boolean(messages);

    const chat = await getChatById({ id });
    let messagesFromDb: DBMessage[] = [];
    let titlePromise: Promise<string> | null = null;

    if (chat) {
      if (chat.userId !== session.user.id) {
        return new ChatSDKError("forbidden:chat").toResponse();
      }
      if (!isToolApprovalFlow) {
        messagesFromDb = await getMessagesByChatId({ id });
      }
    } else if (message?.role === "user") {
      await saveChat({
        id,
        userId: session.user.id,
        title: "New chat",
        visibility: selectedVisibilityType,
      });
      titlePromise = generateTitleFromUserMessage({ message: message as UIMessage });
    }

    const uiMessages = isToolApprovalFlow
      ? (messages as ChatMessage[])
      : [...convertToUIMessages(messagesFromDb), message as ChatMessage];

    const { longitude, latitude, city, country } = geolocation(request);
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const time = new Date().toISOString();

    const requestHints: RequestHints = {
      longitude,
      latitude,
      city,
      country,
      timezone,
      time,
    };

    if (message?.role === "user") {
      await saveMessages({
        messages: [
          {
            chatId: id,
            id: message.id,
            role: "user",
            parts: message.parts,
            attachments: [],
            createdAt: new Date(),
          },
        ],
      });
    }

    // Tool choice part removed, no selectedToolName/sanitization needed

    const modelMessages = await convertToModelMessages(uiMessages);

    const mcpClient = await createMCPClient({
      transport: {
        type: "http",
        url: mcpUrl,
      },
    });
    // The ToolSet expects an explicit type, and mcpClient.tools() returns tools with inputSchema of type FlexibleSchema<unknown>.
    // We'll cast the result to any as a temporary fix to satisfy the type requirement. 
    // This is necessary because the Zod type in the result is generic over <unknown> instead of <never>,
    // but as the tool interface matches shape, this is safe as long as you control mcpTools.
    const mcpTools = (await mcpClient.tools()) as Record<string, any>;

    let confidenceEval: ConfidenceEvalResult | null = null;
    const confidenceTool = mcpTools[CONFIDENCE_TOOL_NAME];
    if (confidenceTool?.execute) {
      try {
        const confidenceMessages = uiMessages
          .map((currentMessage) => ({
            role: currentMessage.role,
            content: getTextFromMessage(currentMessage),
          }))
          .filter((messageText) => messageText.content.trim().length > 0);
        const confidenceResult = await confidenceTool.execute({
          messages: confidenceMessages,
          mode: "full_conversation",
          top_k: 5,
        });
        confidenceEval = extractConfidencePayload(confidenceResult);
      } catch (error) {
        console.warn("confidence eval failed", error);
      }
    }

    const { [CONFIDENCE_TOOL_NAME]: _confidenceTool, ...mcpToolsWithoutMeta } =
      mcpTools;
    const tools = {
      ...mcpToolsWithoutMeta,
      ["date-select"]: dateSelect,
      ["options-select"]: optionsSelect,
    };
    const activeTools = buildActiveTools(tools, confidenceEval);

    const stream = createUIMessageStream({
      originalMessages: isToolApprovalFlow ? uiMessages : undefined,
      execute: async ({ writer: dataStream }) => {
        const result = streamText({
          model: getLanguageModel(selectedChatModel),
          temperature: 0.3,
          system: systemPrompt({ selectedChatModel, requestHints }),
          messages: modelMessages,
          stopWhen: (steps) =>
            hasToolCall("options-select")(steps) ||
            hasToolCall("date-select")(steps),
          prepareStep: ({ steps }) => {
            const lastStep = steps.at(-1);
            const hasSelectableToolResult = Boolean(
              lastStep?.toolResults?.some(
                (toolResult) =>
                  toolResult.toolName === "options-select" ||
                  toolResult.toolName === "date-select"
              )
            );
            if (hasSelectableToolResult) {
              return { toolChoice: "none", activeTools: [] as string[] };
            }
            return { activeTools };
          },
          tools,
          experimental_telemetry: {
            isEnabled: isProductionEnvironment,
            functionId: "stream-text",
          },
          onFinish: async () => {
            await mcpClient.close();
          },
        });

        dataStream.merge(result.toUIMessageStream({ sendReasoning: true }));

        if (titlePromise) {
          const title = await titlePromise;
          dataStream.write({ type: "data-chat-title", data: title });
          updateChatTitleById({ chatId: id, title });
        }
      },
      generateId: generateUUID,
      onFinish: async ({ messages: finishedMessages }) => {
        if (isToolApprovalFlow) {
          for (const finishedMsg of finishedMessages) {
            const existingMsg = uiMessages.find((m) => m.id === finishedMsg.id);
            if (existingMsg) {
              await updateMessage({
                id: finishedMsg.id,
                parts: finishedMsg.parts,
              });
            } else {
              await saveMessages({
                messages: [
                  {
                    id: finishedMsg.id,
                    role: finishedMsg.role,
                    parts: finishedMsg.parts,
                    createdAt: new Date(),
                    attachments: [],
                    chatId: id,
                  },
                ],
              });
            }
          }
        } else if (finishedMessages.length > 0) {
          await saveMessages({
            messages: finishedMessages.map((currentMessage) => ({
              id: currentMessage.id,
              role: currentMessage.role,
              parts: currentMessage.parts,
              createdAt: new Date(),
              attachments: [],
              chatId: id,
            })),
          });
        }
      },
      onError: () => "Oops, an error occurred!",
    });

    return createUIMessageStreamResponse({
      stream,
      async consumeSseStream({ stream: sseStream }) {
        if (!process.env.REDIS_URL) {
          return;
        }
        try {
          const streamContext = getStreamContext();
          if (streamContext) {
            const streamId = generateId();
            await createStreamId({ streamId, chatId: id });
            await streamContext.createNewResumableStream(
              streamId,
              () => sseStream
            );
          }
        } catch (_) {
          // ignore redis errors
        }
      },
    });
  } catch (error) {
    const vercelId = request.headers.get("x-vercel-id");

    if (error instanceof ChatSDKError) {
      return error.toResponse();
    }

    console.error("Unhandled error in chat API:", error, { vercelId });
    return new ChatSDKError("offline:chat").toResponse();
  }
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return new ChatSDKError("bad_request:api").toResponse();
  }

  const session = await getServerSession();

  if (!session?.user) {
    return new ChatSDKError("unauthorized:chat").toResponse();
  }

  const chat = await getChatById({ id });

  if (chat?.userId !== session.user.id) {
    return new ChatSDKError("forbidden:chat").toResponse();
  }

  const deletedChat = await deleteChatById({ id });

  return Response.json(deletedChat, { status: 200 });
}
