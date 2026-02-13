import type { InferUITool, UIMessage, UIMessagePart } from "ai";
import { z } from "zod";

export const messageMetadataSchema = z.object({
  createdAt: z.string(),
});

export type MessageMetadata = z.infer<typeof messageMetadataSchema>;

export type ChatTools = Record<string, InferUITool<any>>;

export type CustomUIDataTypes = {
  "chat-title": string;
};

export type ServiceOSToolChoicePart = {
  type: "serviceos-tool-choice";
  toolName: string;
  optionId: string;
};

export type ChatMessage = UIMessage<
  MessageMetadata,
  CustomUIDataTypes,
  ChatTools
> & {
  parts: Array<
    UIMessagePart<CustomUIDataTypes, ChatTools> | ServiceOSToolChoicePart
  >;
};

export type Attachment = {
  name: string;
  url: string;
  contentType: string;
};
