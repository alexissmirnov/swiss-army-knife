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
  const [optionSelections, setOptionSelections] = useState<
    Record<string, string>
  >({});

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
            console.log("part", part);
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

            if (type === "tool-options-select") {
              const { state } = part as {
                state: string;
                input?: unknown;
                output?: unknown;
              };
              const output =
                state === "output-available"
                  ? (part as { output?: unknown }).output
                  : undefined;
              const outputRecord =
                output && typeof output === "object"
                  ? (output as Record<string, unknown>)
                  : undefined;
              const question =
                typeof outputRecord?.question === "string"
                  ? outputRecord.question
                  : "Choose an option.";
              const optionsRaw = Array.isArray(outputRecord?.options)
                ? outputRecord?.options
                : [];
              const options = optionsRaw
                .map((option, index) => {
                  if (!option || typeof option !== "object") {
                    return null;
                  }
                  const optionRecord = option as Record<string, unknown>;
                  const title =
                    typeof optionRecord.title === "string"
                      ? optionRecord.title.trim()
                      : "";
                  if (!title) {
                    return null;
                  }
                  const value =
                    typeof optionRecord.value === "string"
                      ? optionRecord.value.trim()
                      : title;
                  if (!value) {
                    return null;
                  }
                  const description =
                    typeof optionRecord.description === "string"
                      ? optionRecord.description.trim()
                      : undefined;
                  const id =
                    typeof optionRecord.id === "string"
                      ? optionRecord.id
                      : `${partKey}-option-${index + 1}`;

                  return {
                    id,
                    title,
                    value,
                    description,
                  };
                })
                .filter(
                  (
                    option
                  ): option is {
                    id: string;
                    title: string;
                    value: string;
                    description: string | undefined;
                  } => Boolean(option)
                );

              const selectedOptionTitle = optionSelections[partKey] ?? "";
              const hasSelection = Boolean(selectedOptionTitle);

              if (state === "output-available") {
                return (
                  <div className="w-full max-w-2xl" key={partKey}>
                    <div className="space-y-3">
                      <div className="text-sm font-medium text-foreground">
                        {question}
                      </div>
                      {hasSelection ? (
                        <div className="text-xs text-muted-foreground">
                          Selected: {selectedOptionTitle}
                        </div>
                      ) : null}
                      {options.length > 0 ? (
                        <div className="grid gap-2">
                          {options.map((option) => (
                            <button
                              className={cn(
                                "group relative flex w-full cursor-pointer items-start gap-3 rounded-lg border border-border bg-background p-4 text-left transition-all hover:border-foreground/20 hover:bg-accent/50 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:border-border disabled:hover:bg-background disabled:active:scale-100",
                                hasSelection && option.title === selectedOptionTitle
                                  ? "border-foreground/30 bg-accent/40"
                                  : null
                              )}
                              key={option.id}
                              onClick={() => {
                                if (hasSelection) {
                                  return;
                                }
                                const selection = option.value
                                  .trim()
                                  .slice(0, 2000);
                                if (!selection) {
                                  return;
                                }
                                setOptionSelections((prev) => ({
                                  ...prev,
                                  [partKey]: option.title,
                                }));
                                sendMessage({
                                  role: "user",
                                  parts: [
                                    {
                                      type: "text",
                                      text: selection,
                                      ui: {
                                        hidden: true,
                                        source: "options-select",
                                      },
                                    } as any,
                                  ],
                                });
                              }}
                              disabled={hasSelection}
                              type="button"
                            >
                              <div className="flex-1 space-y-1">
                                <div className="font-medium text-sm leading-tight text-foreground">
                                  {option.title}
                                </div>
                                {option.description ? (
                                  <div className="text-muted-foreground text-xs leading-relaxed">
                                    {option.description}
                                  </div>
                                ) : null}
                              </div>
                              <div className="text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100">
                                <svg
                                  className="size-4"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth={2}
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    d="M9 5l7 7-7 7"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                </svg>
                              </div>
                            </button>
                          ))}
                        </div>
                      ) : (
                        <div className="text-muted-foreground text-sm">
                          No options available.
                        </div>
                      )}
                    </div>
                  </div>
                );
              }

              return null;
            }

            if (type.startsWith("dynamic-tool")) {
              const { toolCallId, state, toolName } = part as {
                toolCallId: string;
                toolName: string;
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
                  <Tool className="w-full border-none" defaultOpen={false}>
                    <ToolHeader state={state} type={toolName} />
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
