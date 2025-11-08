export interface StreamMessage {
  type: "chunk" | "error" | "done";
  content?: string;
  message?: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

