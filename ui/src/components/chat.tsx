"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { SquareIcon } from "lucide-react";
import type { FormEvent } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  PromptInput,
  PromptInputModelSelect,
  PromptInputModelSelectContent,
  PromptInputModelSelectItem,
  PromptInputModelSelectTrigger,
  PromptInputModelSelectValue,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputToolbar,
  PromptInputTools,
} from "@/components/elements/prompt-input";
import { Messages } from "@/components/messages";
import { Button } from "@/components/ui/button";
import { chatModels, DEFAULT_CHAT_MODEL } from "@/lib/ai/models";

export function Chat() {
  const chatId = useRef(crypto.randomUUID()).current;
  const [input, setInput] = useState("");
  const [selectedModelId, setSelectedModelId] = useState(DEFAULT_CHAT_MODEL);

  useEffect(() => {
    const stored = window.localStorage.getItem("chat-model");
    if (stored) {
      setSelectedModelId(stored);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem("chat-model", selectedModelId);
  }, [selectedModelId]);

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
        prepareSendMessagesRequest(request) {
          return {
            body: {
              messages: request.messages,
              selectedChatModel: selectedModelId,
            },
          };
        },
      }),
    [selectedModelId]
  );

  const { messages, sendMessage, status, stop } = useChat({
    id: chatId,
    transport,
    messages: [],
    generateId: () => crypto.randomUUID(),
  });

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = input.trim();
    if (!trimmed) {
      return;
    }

    sendMessage({
      role: "user",
      parts: [{ type: "text", text: trimmed }],
    });

    setInput("");
  };

  return (
    <div className="overscroll-behavior-contain flex h-dvh min-w-0 touch-pan-y flex-col bg-background">
      <Messages messages={messages} status={status} />

      <div className="sticky bottom-0 z-10 mx-auto flex w-full max-w-4xl gap-2 border-t-0 bg-background px-2 pb-3 md:px-4 md:pb-4">
        <PromptInput onSubmit={handleSubmit}>
          <PromptInputTextarea
            data-testid="multimodal-input"
            onChange={(event) => setInput(event.target.value)}
            placeholder="Send a message..."
            value={input}
          />
          <PromptInputToolbar className="border-top-0! border-t-0! p-0 shadow-none dark:border-0 dark:border-transparent!">
            <PromptInputTools className="gap-0 sm:gap-0.5">
              <PromptInputModelSelect
                onValueChange={setSelectedModelId}
                value={selectedModelId}
              >
                <PromptInputModelSelectTrigger>
                  <PromptInputModelSelectValue />
                </PromptInputModelSelectTrigger>
                <PromptInputModelSelectContent>
                  {chatModels.map((model) => (
                    <PromptInputModelSelectItem key={model.id} value={model.id}>
                      {model.name}
                    </PromptInputModelSelectItem>
                  ))}
                </PromptInputModelSelectContent>
              </PromptInputModelSelect>
            </PromptInputTools>

            {status === "streaming" ? (
              <Button
                aria-label="Stop generating"
                className="size-8 rounded-full"
                onClick={() => stop()}
                type="button"
                variant="ghost"
              >
                <SquareIcon className="size-4" />
              </Button>
            ) : (
              <PromptInputSubmit
                className="size-8 rounded-full"
                data-testid="send-button"
                disabled={!input.trim()}
                status={status}
              />
            )}
          </PromptInputToolbar>
        </PromptInput>
      </div>
    </div>
  );
}
