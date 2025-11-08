import React, { useRef, useEffect } from "react";
import { ChatMessage } from "../utils/types";
import { ChatMessageComponent } from "./ChatMessage";
import { WelcomeMessage } from "./WelcomeMessage";
import { LoadingIndicator } from "./LoadingIndicator";
import { StreamingMessage } from "./StreamingMessage";
import { ErrorMessage } from "./ErrorMessage";

interface ChatMessagesProps {
  messages: ChatMessage[];
  streamingContent: string;
  isLoading: boolean;
  error: string | null;
}

export const ChatMessages: React.FC<ChatMessagesProps> = ({
  messages,
  streamingContent,
  isLoading,
  error,
}) => {
  const chatEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, streamingContent]);

  return (
    <div
      ref={messagesContainerRef}
      className="flex-1 overflow-y-auto p-6 space-y-4"
    >
      {messages.length === 0 && !isLoading && <WelcomeMessage />}

      {messages.map((message) => (
        <ChatMessageComponent key={message.id} message={message} />
      ))}

      {streamingContent && <StreamingMessage content={streamingContent} />}

      {isLoading && !streamingContent && <LoadingIndicator />}

      {error && <ErrorMessage message={error} />}

      <div ref={chatEndRef} />
    </div>
  );
};

