import { Injectable } from "@nestjs/common";
import { InferenceClient } from "@huggingface/inference";
import { NewsArticle } from "../interfaces/news.interface";

@Injectable()
export class LlmService {
  private readonly hf: InferenceClient;
  private readonly model = "google/medgemma-27b-text-it"; // Simple free model - commonly available
  constructor() {
    const apiKey =
      process.env.HUGGINGFACE_API_KEY ||
      "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";
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

    try {
      // Use textGeneration for gpt2 (not conversational)
      const response = await this.hf.chatCompletion({
        model: "mistralai/Mistral-7B-Instruct-v0.2",
        provider: "featherless-ai",
        messages: [{ role: "user", content: prompt }],
        // Add other necessary parameters (e.g., max_new_tokens)
        parameters: {
          max_new_tokens: 512, // A good default to limit cost/latency
        },
      });

      console.log("Response:", response.choices[0].message.content);

      // Handle response from Hugging Face library
      let generatedText = response.choices[0].message.content || "";

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
      console.error("LLM error details:", {
        message: error?.message,
        status: error?.status,
        responseStatus: error?.response?.status,
        responseData: error?.response?.data,
        httpRequest: error?.httpRequest,
        httpResponse: error?.httpResponse,
        errorBody: error?.httpResponse?.body,
      });

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
      } else if (
        errorMessage?.includes("No Inference Provider") ||
        errorMessage?.includes("inference provider")
      ) {
        yield "The selected AI model is not available. Please try a different model or contact support.";
      } else if (
        errorMessage?.includes("not supported by any provider") ||
        error?.httpResponse?.body?.error?.code === "model_not_supported"
      ) {
        yield "The selected AI model is not supported by your enabled providers. Please enable providers in your Hugging Face account settings or try a different model.";
      } else {
        yield "I apologize, but I encountered an error while generating the answer. Please try again.";
      }
    }
  }
}
