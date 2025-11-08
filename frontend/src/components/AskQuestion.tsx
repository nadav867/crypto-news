import React, { useState } from "react";
import { ChatMessages } from "./ChatMessages";
import { ChatInput } from "./ChatInput";
import { askQuestion } from "../api/ask-api";
import { ChatMessage, StreamMessage } from "../utils/types";

const AskQuestion: React.FC = () => {
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [streamingContent, setStreamingContent] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || isLoading) return;

    const userQuestion = question.trim();
    setQuestion("");
    setError(null);
    setIsLoading(true);
    setStreamingContent("");

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: userQuestion,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);

    try {
      let fullAnswer = "";

      for await (const data of askQuestion(userQuestion)) {
        if (data.type === "chunk" && data.content) {
          fullAnswer += data.content;
          setStreamingContent(fullAnswer);
        } else if (data.type === "error") {
          throw new Error(data.message || "Unknown error");
        } else if (data.type === "done") {
          const assistantMessage: ChatMessage = {
            id: (Date.now() + 1).toString(),
            role: "assistant",
            content: fullAnswer,
            timestamp: new Date(),
          };
          setMessages((prev) => [...prev, assistantMessage]);
          setStreamingContent("");
          setIsLoading(false);
          return;
        }
      }

      if (fullAnswer) {
        const assistantMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: fullAnswer,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, assistantMessage]);
      }
      setStreamingContent("");
      setIsLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setIsLoading(false);
      setStreamingContent("");
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-2xl flex flex-col h-[calc(100vh-200px)] max-h-[800px]">
      <ChatMessages
        messages={messages}
        streamingContent={streamingContent}
        isLoading={isLoading}
        error={error}
      />
      <ChatInput
        question={question}
        setQuestion={setQuestion}
        onSubmit={handleSubmit}
        isLoading={isLoading}
      />
    </div>
  );
};

export default AskQuestion;
