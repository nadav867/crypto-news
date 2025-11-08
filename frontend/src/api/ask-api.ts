import { parseSSEStream } from "../utils/sse-parser.util";
import { StreamMessage } from "../utils/types";

export async function* askQuestion(
  question: string
): AsyncGenerator<StreamMessage, void, unknown> {
  const response = await fetch(`/ask?q=${encodeURIComponent(question)}`);

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to get answer");
  }

  const reader = response.body?.getReader();

  if (!reader) {
    throw new Error("No response body");
  }

  yield* parseSSEStream(reader);
}

