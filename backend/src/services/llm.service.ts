import { Injectable } from "@nestjs/common";
import { HuggingFaceApi } from "../api/huggingface-api";
import { buildPrompt } from "../utils/prompt-builder.util";
import { handleLlmError, logLlmError } from "../utils/llm-error-handler.util";
import { NewsArticle } from "../interfaces/news.interface";

@Injectable()
export class LlmService {
  constructor(private readonly hfApi: HuggingFaceApi) {}

  async *generateAnswer(
    question: string,
    articles: NewsArticle[]
  ): AsyncGenerator<string, void, unknown> {
    const prompt = buildPrompt(question, articles);

    try {
      const generatedText = await this.hfApi.chatCompletion(prompt);

      if (!generatedText) {
        yield "I apologize, but I could not generate a response. Please try again.";
        return;
      }

      const words = generatedText.split(" ");
      for (const word of words) {
        if (word.trim()) {
          yield word + " ";
          await new Promise((resolve) => setTimeout(resolve, 20));
        }
      }
    } catch (error: any) {
      logLlmError(error);
      yield handleLlmError(error);
    }
  }
}
