"use client";

import type { UIMessage } from "ai";
import { SparklesIcon } from "lucide-react";
import { Message, MessageAvatar, MessageContent } from "@/components/elements/message";
import { Response } from "@/components/elements/response";

function getMessageText(message: UIMessage) {
  if ("parts" in message && Array.isArray(message.parts)) {
    return message.parts
      .filter((part) => part.type === "text")
      .map((part) => part.text)
      .join("");
  }

  if ("content" in message && typeof message.content === "string") {
    return message.content;
  }

  return "";
}

export function ChatMessage({ message }: { message: UIMessage }) {
  const text = getMessageText(message);
  const isUser = message.role === "user";

  return (
    <Message from={message.role}>
      <MessageAvatar
        name={isUser ? "ME" : "AI"}
        src={isUser ? "/file.svg" : "/chatgpt.svg"}
      />
      <MessageContent>
        <Response>{text}</Response>
      </MessageContent>
    </Message>
  );
}

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
