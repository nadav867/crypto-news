import React from "react";

interface WelcomeMessageProps {}

export const WelcomeMessage: React.FC<WelcomeMessageProps> = () => {
  return (
    <div className="text-center text-gray-500 mt-20">
      <p className="text-xl mb-2">👋 Welcome to Crypto News Agent!</p>
      <p>Ask me anything about cryptocurrency news.</p>
    </div>
  );
};

