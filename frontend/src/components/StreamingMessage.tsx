import React from "react";

interface StreamingMessageProps {
  content: string;
}

export const StreamingMessage: React.FC<StreamingMessageProps> = ({
  content,
}) => {
  return (
    <div className="flex justify-start">
      <div className="max-w-[80%] rounded-2xl px-4 py-3 bg-gray-100 text-gray-800">
        <p className="whitespace-pre-wrap leading-relaxed">
          {content}
          <span className="inline-block w-2 h-5 bg-indigo-600 ml-1 animate-pulse"></span>
        </p>
      </div>
    </div>
  );
};

