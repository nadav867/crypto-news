import { Injectable } from "@nestjs/common";
import { InferenceClient } from "@huggingface/inference";
import { NewsArticle } from "../interfaces/news.interface";

@Injectable()
export class LlmService {
  private readonly hf: InferenceClient;
  private readonly model = "google/medgemma-27b-text-it";
  constructor() {
    const apiKey =
      process.env.HUGGINGFACE_API_KEY ||
      "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";
    // Use router endpoint as required - include /models path
    this.hf = new InferenceClient(apiKey);
  }

  async *generateAnswer(
    question: string,
    articles: NewsArticle[]
  ): AsyncGenerator<string, void, unknown> {
    const context = articles
      .map(
        (article, index) =>
          `[Article ${index + 1}]\nTitle: ${article.title}\nSource: ${
            article.source
          }\nContent: ${article.content.substring(0, 2000)}\nURL: ${
            article.url
          }`
      )
      .join("\n\n");

    const prompt = `You are a helpful AI crypto journalist. Answer the user's question based on the provided news articles. 
                    Be accurate, cite sources when possible, and if the articles don't contain enough information, say so.
                    Format your response naturally and conversationally.

                    Context from recent crypto news:

                    ${context}

                    Question: ${question}

                    Answer:`;

    // console.log("Prompt:", prompt);

    try {
      const response = await this.hf.textGeneration({
        model: this.model,
        inputs: prompt,
        parameters: {
          max_new_tokens: 512,
          temperature: 0.7,
          return_full_text: false,
        },
        options: {
          wait_for_model: true,
        },
      });

      // console.log("Response:", response);

      // Handle response from Hugging Face library
      let generatedText = "";
      if (typeof response === "string") {
        generatedText = response;
      } else if (response.generated_text) {
        generatedText = response.generated_text;
      } else if (Array.isArray(response) && response[0]) {
        generatedText = response[0].generated_text || "";
      }

      if (!generatedText) {
        yield "I apologize, but I could not generate a response. Please try again.";
        return;
      }

      // Stream the response word by word
      const words = generatedText.split(" ");
      for (const word of words) {
        if (word.trim()) {
          yield word + " ";
          // Small delay to simulate streaming
          await new Promise((resolve) => setTimeout(resolve, 20));
        }
      }
    } catch (error: any) {
      console.error("LLM error:", error);

      // Handle specific Hugging Face errors
      const errorMessage =
        error?.message || error?.response?.data?.error || String(error);
      const statusCode = error?.response?.status || error?.status;

      if (statusCode === 503 || errorMessage?.includes("loading")) {
        yield "The AI model is currently loading. Please wait a moment and try again.";
      } else if (statusCode === 429 || errorMessage?.includes("rate limit")) {
        yield "Rate limit exceeded. Please wait a moment and try again.";
      } else if (statusCode === 400 && errorMessage?.includes("paused")) {
        yield "The AI model is currently paused. Please try again later or contact support.";
      } else if (
        statusCode === 410 ||
        errorMessage?.includes("no longer supported")
      ) {
        yield "The API endpoint has changed. Please contact support.";
      } else {
        yield "I apologize, but I encountered an error while generating the answer. Please try again.";
      }
    }
  }
}
