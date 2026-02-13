import { geolocation } from "@vercel/functions";
import {
  convertToModelMessages,
  createUIMessageStream,
  createUIMessageStreamResponse,
  generateId,
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
import { convertToUIMessages, generateUUID } from "@/lib/utils";
import { generateTitleFromUserMessage } from "../../actions";
import { type PostRequestBody, postRequestBodySchema } from "./schema";

export const maxDuration = 60;

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

    const requestHints: RequestHints = {
      longitude,
      latitude,
      city,
      country,
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

    const toolChoicePartType = "serviceos-tool-choice" as const;
    let toolChoiceMessage:
      | { type: typeof toolChoicePartType; toolName: string; optionId: string }
      | undefined;
    for (const msg of uiMessages) {
      if (msg.role !== "user") {
        continue;
      }
      for (const part of msg.parts) {
        if (part.type === toolChoicePartType) {
          toolChoiceMessage = part as {
            type: typeof toolChoicePartType;
            toolName: string;
            optionId: string;
          };
        }
      }
    }

    const selectedToolName = toolChoiceMessage?.toolName;
    const sanitizedMessages = uiMessages.map((msg) => {
      if (msg.role !== "user") {
        return msg;
      }
      const filteredParts = msg.parts.filter(
        (part) => part.type !== toolChoicePartType
      );
      if (filteredParts.length === msg.parts.length) {
        return msg;
      }
      return {
        ...msg,
        parts: filteredParts,
      } as ChatMessage;
    });

    const modelMessages = await convertToModelMessages(sanitizedMessages);
    if (selectedToolName) {
      modelMessages.push({
        role: "system",
        content: `User selected the workflow tool: ${selectedToolName}. Call this tool next.`,
      });
    }

    const mcpClient = await createMCPClient({
      transport: {
        type: "http",
        url: mcpUrl,
      },
    });
    const mcpTools = await mcpClient.tools();

    const stream = createUIMessageStream({
      originalMessages: isToolApprovalFlow ? uiMessages : undefined,
      execute: async ({ writer: dataStream }) => {
        const result = streamText({
          model: getLanguageModel(selectedChatModel),
          system: systemPrompt({ selectedChatModel, requestHints }),
          messages: modelMessages,
          stopWhen: stepCountIs(5),
          toolChoice: selectedToolName
            ? { type: "tool", toolName: selectedToolName }
            : undefined,
          activeTools: selectedToolName
            ? [selectedToolName]
            : undefined,
          prepareStep: ({ steps }) => {
            const lastStep = steps.at(-1);
            const hasDisambiguateResult = Boolean(
              lastStep?.toolResults?.some(
                (toolResult) => toolResult.toolName === "serviceos_disambiguate"
              )
            );
            if (hasDisambiguateResult) {
              return { toolChoice: "none", activeTools: [] as string[] };
            }
            return {};
          },
          tools: mcpTools,
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
