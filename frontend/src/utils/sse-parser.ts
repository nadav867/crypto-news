import { StreamMessage } from "../types";

export async function* parseSSEStream(
  reader: ReadableStreamDefaultReader<Uint8Array>
): AsyncGenerator<StreamMessage, void, unknown> {
  const decoder = new TextDecoder();
  let buffer = "";

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
          yield data;
        } catch (parseError) {
          console.error("Parse error:", parseError);
        }
      }
    }
  }
}
