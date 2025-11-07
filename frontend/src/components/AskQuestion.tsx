import React, { useState, useRef, useEffect } from "react";

interface StreamMessage {
  type: "chunk" | "error" | "done";
  content?: string;
  message?: string;
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

const AskQuestion: React.FC = () => {
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [streamingContent, setStreamingContent] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, streamingContent]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || isLoading) return;

    const userQuestion = question.trim();
    setQuestion("");
    setError(null);
    setIsLoading(true);
    setStreamingContent("");

    // Add user message to chat
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: userQuestion,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);

    try {
      const response = await fetch(
        `/ask?q=${encodeURIComponent(userQuestion)}`
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to get answer");
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error("No response body");
      }

      let buffer = "";
      let fullAnswer = "";

      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data: StreamMessage = JSON.parse(line.slice(6));

              if (data.type === "chunk" && data.content) {
                fullAnswer += data.content;
                setStreamingContent(fullAnswer);
              } else if (data.type === "error") {
                throw new Error(data.message || "Unknown error");
              } else if (data.type === "done") {
                // Add assistant message to chat
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
            } catch (parseError) {
              console.error("Parse error:", parseError);
            }
          }
        }
      }

      // If we exit the loop without "done", add the message anyway
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
      {/* Chat Messages Area */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-6 space-y-4"
      >
        {messages.length === 0 && !isLoading && (
          <div className="text-center text-gray-500 mt-20">
            <p className="text-xl mb-2">👋 Welcome to Crypto News Agent!</p>
            <p>Ask me anything about cryptocurrency news.</p>
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${
              message.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                message.role === "user"
                  ? "bg-indigo-600 text-white"
                  : "bg-gray-100 text-gray-800"
              }`}
            >
              <p className="whitespace-pre-wrap leading-relaxed">
                {message.content}
              </p>
            </div>
          </div>
        ))}

        {/* Streaming message */}
        {streamingContent && (
          <div className="flex justify-start">
            <div className="max-w-[80%] rounded-2xl px-4 py-3 bg-gray-100 text-gray-800">
              <p className="whitespace-pre-wrap leading-relaxed">
                {streamingContent}
                <span className="inline-block w-2 h-5 bg-indigo-600 ml-1 animate-pulse"></span>
              </p>
            </div>
          </div>
        )}

        {/* Loading indicator */}
        {isLoading && !streamingContent && (
          <div className="flex justify-start">
            <div className="max-w-[80%] rounded-2xl px-4 py-3 bg-gray-100 text-gray-800">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div
                  className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                  style={{ animationDelay: "0.2s" }}
                ></div>
                <div
                  className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                  style={{ animationDelay: "0.4s" }}
                ></div>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="flex justify-start">
            <div className="max-w-[80%] rounded-2xl px-4 py-3 bg-red-50 border border-red-200 text-red-700">
              {error}
            </div>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-gray-200 p-4">
        <form onSubmit={handleSubmit} className="flex gap-3">
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask about crypto news..."
            disabled={isLoading}
            className="flex-1 px-4 py-3 text-base border-2 border-gray-200 rounded-lg outline-none focus:border-indigo-500 transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
          />
          <button
            type="submit"
            disabled={isLoading || !question.trim()}
            className="px-6 py-3 text-base font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? "⏳" : "Send"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AskQuestion;
