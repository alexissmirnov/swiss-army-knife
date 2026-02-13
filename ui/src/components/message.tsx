"use client";
import type { UseChatHelpers } from "@ai-sdk/react";
import { useState } from "react";
import type { Vote } from "@/db/schema";
import type { ChatMessage } from "@/lib/types";
import { cn, sanitizeText } from "@/lib/utils";
import { MessageContent } from "./elements/message";
import { Response } from "./elements/response";
import { Suggestion, Suggestions } from "./elements/suggestion";
import {
  Tool,
  ToolContent,
  ToolHeader,
  ToolInput,
  ToolOutput,
} from "./elements/tool";
import { SparklesIcon } from "./icons";
import { MessageActions } from "./message-actions";
import { MessageEditor } from "./message-editor";
import { MessageReasoning } from "./message-reasoning";
import { PreviewAttachment } from "./preview-attachment";
import { Weather } from "./weather";

const PurePreviewMessage = ({
  addToolApprovalResponse,
  chatId,
  message,
  vote,
  isLoading,
  setMessages,
  regenerate,
  sendMessage,
  isReadonly,
  requiresScrollPadding: _requiresScrollPadding,
}: {
  addToolApprovalResponse: UseChatHelpers<ChatMessage>["addToolApprovalResponse"];
  chatId: string;
  message: ChatMessage;
  vote: Vote | undefined;
  isLoading: boolean;
  setMessages: UseChatHelpers<ChatMessage>["setMessages"];
  regenerate: UseChatHelpers<ChatMessage>["regenerate"];
  sendMessage: UseChatHelpers<ChatMessage>["sendMessage"];
  isReadonly: boolean;
  requiresScrollPadding: boolean;
}) => {
  const [mode, setMode] = useState<"view" | "edit">("view");

  const attachmentsFromMessage = message.parts.filter(
    (part) => part.type === "file"
  );

  return (
    <div
      className="group/message fade-in w-full animate-in duration-200"
      data-role={message.role}
      data-testid={`message-${message.role}`}
    >
      <div
        className={cn("flex w-full items-start gap-2 md:gap-3", {
          "justify-end": message.role === "user" && mode !== "edit",
          "justify-start": message.role === "assistant",
        })}
      >
        {message.role === "assistant" && (
          <div className="-mt-1 flex size-8 shrink-0 items-center justify-center rounded-full bg-background ring-1 ring-border">
            <SparklesIcon size={14} />
          </div>
        )}

        <div
          className={cn("flex flex-col", {
            "gap-2 md:gap-4": message.parts?.some(
              (p) => p.type === "text" && p.text?.trim()
            ),
            "w-full":
              (message.role === "assistant" &&
                (message.parts?.some(
                  (p) => p.type === "text" && p.text?.trim()
                ) ||
                  message.parts?.some((p) => p.type.startsWith("tool-")))) ||
              mode === "edit",
            "max-w-[calc(100%-2.5rem)] sm:max-w-[min(fit-content,80%)]":
              message.role === "user" && mode !== "edit",
          })}
        >
          {attachmentsFromMessage.length > 0 && (
            <div
              className="flex flex-row justify-end gap-2"
              data-testid={"message-attachments"}
            >
              {attachmentsFromMessage.map((attachment) => (
                <PreviewAttachment
                  attachment={{
                    name: attachment.filename ?? "file",
                    contentType: attachment.mediaType,
                    url: attachment.url,
                  }}
                  key={attachment.url}
                />
              ))}
            </div>
          )}

          {message.parts?.map((part, index) => {
            const { type } = part;
            const key = `message-${message.id}-part-${index}`;
            const partToolCallId =
              typeof part === "object" &&
              part !== null &&
              "toolCallId" in part &&
              typeof (part as { toolCallId?: unknown }).toolCallId === "string"
                ? (part as { toolCallId: string }).toolCallId
                : undefined;
            const partKey = partToolCallId ? `tool-${partToolCallId}` : key;

            if (type === "reasoning") {
              const hasContent = part.text?.trim().length > 0;
              const isStreaming = "state" in part && part.state === "streaming";
              if (hasContent || isStreaming) {
                return (
                  <MessageReasoning
                    isLoading={isLoading || isStreaming}
                    key={partKey}
                    reasoning={part.text || ""}
                  />
                );
              }
            }

            if (type === "text") {
              if (mode === "view") {
                return (
                  <div key={partKey}>
                    <MessageContent
                      className={cn({
                        "wrap-break-word w-fit rounded-2xl px-3 py-2 text-right text-white":
                          message.role === "user",
                        "bg-transparent px-0 py-0 text-left":
                          message.role === "assistant",
                      })}
                      data-testid="message-content"
                      style={
                        message.role === "user"
                          ? { backgroundColor: "#006cff" }
                          : undefined
                      }
                    >
                      <Response>{sanitizeText(part.text)}</Response>
                    </MessageContent>
                  </div>
                );
              }

              if (mode === "edit") {
                return (
                  <div className="flex w-full flex-row items-start gap-3" key={partKey}>
                    <div className="size-8" />
                    <div className="min-w-0 flex-1">
                      <MessageEditor
                        key={message.id}
                        message={message}
                        regenerate={regenerate}
                        setMessages={setMessages}
                        setMode={setMode}
                      />
                    </div>
                  </div>
                );
              }
            }

            if (type === "tool-getWeather") {
              const { toolCallId, state } = part;
              const approvalId = (part as { approval?: { id: string } })
                .approval?.id;
              const isDenied =
                state === "output-denied" ||
                (state === "approval-responded" &&
                  (part as { approval?: { approved?: boolean } }).approval
                    ?.approved === false);
              const widthClass = "w-[min(100%,450px)]";

              if (state === "output-available") {
                return (
                  <div className={widthClass} key={partKey}>
                    <Weather weatherAtLocation={part.output} />
                  </div>
                );
              }

              if (isDenied) {
                return (
                  <div className={widthClass} key={partKey}>
                    <Tool className="w-full" defaultOpen={true}>
                      <ToolHeader
                        state="output-denied"
                        type="tool-getWeather"
                      />
                      <ToolContent>
                        <div className="px-4 py-3 text-muted-foreground text-sm">
                          Weather lookup was denied.
                        </div>
                      </ToolContent>
                    </Tool>
                  </div>
                );
              }

              if (state === "approval-responded") {
                return (
                  <div className={widthClass} key={partKey}>
                    <Tool className="w-full" defaultOpen={true}>
                      <ToolHeader state={state} type="tool-getWeather" />
                      <ToolContent>
                        <ToolInput input={part.input} />
                      </ToolContent>
                    </Tool>
                  </div>
                );
              }

              return (
                <div className={widthClass} key={partKey}>
                  <Tool className="w-full" defaultOpen={true}>
                    <ToolHeader state={state} type="tool-getWeather" />
                    <ToolContent>
                      {(state === "input-available" ||
                        state === "approval-requested") && (
                        <ToolInput input={part.input} />
                      )}
                      {state === "approval-requested" && approvalId && (
                        <div className="flex items-center justify-end gap-2 border-t px-4 py-3">
                          <button
                            className="rounded-md px-3 py-1.5 text-muted-foreground text-sm transition-colors hover:bg-muted hover:text-foreground"
                            onClick={() => {
                              addToolApprovalResponse({
                                id: approvalId,
                                approved: false,
                                reason: "User denied weather lookup",
                              });
                            }}
                            type="button"
                          >
                            Deny
                          </button>
                          <button
                            className="rounded-md bg-primary px-3 py-1.5 text-primary-foreground text-sm transition-colors hover:bg-primary/90"
                            onClick={() => {
                              addToolApprovalResponse({
                                id: approvalId,
                                approved: true,
                              });
                            }}
                            type="button"
                          >
                            Allow
                          </button>
                        </div>
                      )}
                    </ToolContent>
                  </Tool>
                </div>
              );
            }

            if (type === "tool-serviceos_disambiguate") {
              const { toolCallId, state } = part;
              const widthClass = "w-[min(100%,560px)]";
              const output =
                state === "output-available"
                  ? (part as { output?: unknown }).output
                  : undefined;
              type DisambiguateOption = {
                id: string;
                toolName: string;
                title: string;
                description?: string;
              };
              type DisambiguatePayload = {
                question?: string;
                options?: DisambiguateOption[];
              };

              const outputRecord =
                output && typeof output === "object"
                  ? (output as Record<string, unknown>)
                  : undefined;
              const structuredPayload =
                outputRecord?.structuredContent &&
                typeof outputRecord.structuredContent === "object"
                  ? (outputRecord.structuredContent as DisambiguatePayload)
                  : undefined;
              const metaValue = outputRecord?.meta ?? outputRecord?._meta;
              const metaRecord =
                metaValue && typeof metaValue === "object"
                  ? (metaValue as Record<string, unknown>)
                  : undefined;
              const serviceosPayload =
                metaRecord?.serviceos &&
                typeof metaRecord.serviceos === "object"
                  ? (metaRecord.serviceos as DisambiguatePayload)
                  : undefined;
              const outputPayload =
                outputRecord && typeof outputRecord === "object"
                  ? (outputRecord as DisambiguatePayload)
                  : undefined;
              const options =
                serviceosPayload?.options ??
                structuredPayload?.options ??
                outputPayload?.options ??
                [];
              const question =
                serviceosPayload?.question ??
                structuredPayload?.question ??
                outputPayload?.question ??
                "Which workflow should I run?";

              if (state === "output-available") {
                return (
                  <div className={widthClass} key={partKey}>
                    <Tool className="w-full" defaultOpen={true}>
                      <ToolHeader state={state} type={type} />
                      <ToolContent>
                        <div className="space-y-3 px-4 py-3">
                          <div className="text-sm">{question}</div>
                          {options.length > 0 && (
                            <Suggestions>
                              {options.map((option) => (
                                <Suggestion
                                  className="h-auto px-4 py-2"
                                  key={option.id}
                                  onClick={() => {
                                    sendMessage({
                                      role: "user",
                                      parts: [
                                        {
                                          type: "serviceos-tool-choice",
                                          toolName: option.toolName,
                                          optionId: option.id,
                                        },
                                        {
                                          type: "text",
                                          text: option.title,
                                        },
                                      ],
                                    });
                                  }}
                                  suggestion={option.title}
                                >
                                  <div className="text-left">
                                    <div className="font-medium text-sm">
                                      {option.title}
                                    </div>
                                    {option.description ? (
                                      <div className="text-muted-foreground text-xs">
                                        {option.description}
                                      </div>
                                    ) : null}
                                  </div>
                                </Suggestion>
                              ))}
                            </Suggestions>
                          )}
                        </div>
                      </ToolContent>
                    </Tool>
                  </div>
                );
              }

              return (
                <div className={widthClass} key={partKey}>
                  <Tool className="w-full" defaultOpen={true}>
                    <ToolHeader state={state} type={type} />
                    <ToolContent>
                      {(state === "input-available" ||
                        state === "approval-requested") && (
                        <ToolInput input={part.input} />
                      )}
                    </ToolContent>
                  </Tool>
                </div>
              );
            }

            if (type.startsWith("tool-")) {
              const { toolCallId, state } = part as {
                toolCallId: string;
                state: string;
                input?: unknown;
                output?: unknown;
                errorText?: string;
              };
              const widthClass = "w-[min(100%,560px)]";
              const outputNode = (part as { output?: unknown }).output ? (
                <pre className="overflow-x-auto p-3 font-mono text-xs">
                  {JSON.stringify((part as { output?: unknown }).output, null, 2)}
                </pre>
              ) : null;

              return (
                <div className={widthClass} key={partKey}>
                  <Tool className="w-full" defaultOpen={true}>
                    <ToolHeader state={state} type={type} />
                    <ToolContent>
                      {(state === "input-available" ||
                        state === "approval-requested") && (
                        <ToolInput input={part.input} />
                      )}
                      {(part as { output?: unknown }).output ||
                      (part as { errorText?: string }).errorText ? (
                        <ToolOutput
                          errorText={(part as { errorText?: string }).errorText}
                          output={outputNode}
                        />
                      ) : null}
                    </ToolContent>
                  </Tool>
                </div>
              );
            }

            return null;
          })}

          {!isReadonly && (
            <MessageActions
              chatId={chatId}
              isLoading={isLoading}
              key={`action-${message.id}`}
              message={message}
              setMode={setMode}
              vote={vote}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export const PreviewMessage = PurePreviewMessage;

export const ThinkingMessage = () => {
  return (
    <div
      className="group/message fade-in w-full animate-in duration-300"
      data-role="assistant"
      data-testid="message-assistant-loading"
    >
      <div className="flex items-start justify-start gap-3">
        <div className="-mt-1 flex size-8 shrink-0 items-center justify-center rounded-full bg-background ring-1 ring-border">
          <div className="animate-pulse">
            <SparklesIcon size={14} />
          </div>
        </div>

        <div className="flex w-full flex-col gap-2 md:gap-4">
          <div className="flex items-center gap-1 p-0 text-muted-foreground text-sm">
            <span className="animate-pulse">Thinking</span>
            <span className="inline-flex">
              <span className="animate-bounce [animation-delay:0ms]">.</span>
              <span className="animate-bounce [animation-delay:150ms]">.</span>
              <span className="animate-bounce [animation-delay:300ms]">.</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
