import type { InferSelectModel } from "drizzle-orm";
import {
  users,
  chats,
  messages,
  votes,
  documents,
  suggestions,
  streams,
} from "@/db/schema";

export const user = users;
export const chat = chats;
export const message = messages;
export const vote = votes;
export const document = documents;
export const suggestion = suggestions;
export const stream = streams;

export type User = InferSelectModel<typeof users>;
export type Chat = InferSelectModel<typeof chats>;
export type DBMessage = InferSelectModel<typeof messages>;
export type Vote = InferSelectModel<typeof votes>;
export type Document = InferSelectModel<typeof documents>;
export type Suggestion = InferSelectModel<typeof suggestions>;
export type Stream = InferSelectModel<typeof streams>;
