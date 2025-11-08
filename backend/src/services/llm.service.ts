import { Injectable } from "@nestjs/common";
import axios from "axios";
import { NewsArticle } from "../interfaces/news.interface";

@Injectable()
export class LlmService {
  private readonly apiUrl = "https://router.huggingface.co/hf-inference/models";
  private readonly model =
    "shorecode/t5-efficient-tiny-summarizer-general-purpose-v3"; // Free model
  private readonly apiKey =
    process.env.HUGGINGFACE_API_KEY || "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";

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
      const response = await axios.post(
        `${this.apiUrl}/${this.model}`,
        {
          inputs: prompt,
          parameters: {
            max_new_tokens: 512,
            temperature: 0.7,
            return_full_text: false,
          },
          options: {
            wait_for_model: true,
          },
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${this.apiKey}`,
          },
          responseType: "json",
          timeout: 60000, // 60 second timeout
        }
      );

      console.log("Response:", response.data);

      // Handle different response formats from Hugging Face
      let generatedText = "";
      if (Array.isArray(response.data) && response.data[0]) {
        generatedText = response.data[0].generated_text || "";
      } else if (response.data.generated_text) {
        generatedText = response.data.generated_text;
      } else if (typeof response.data === "string") {
        generatedText = response.data;
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
      console.error("LLM error:", error.response?.data || error.message);

      // Handle specific Hugging Face errors
      if (error.response?.status === 503) {
        yield "The AI model is currently loading. Please wait a moment and try again.";
      } else if (error.response?.status === 429) {
        yield "Rate limit exceeded. Please wait a moment and try again.";
      } else if (
        error.response?.status === 400 &&
        error.response?.data?.error?.includes("paused")
      ) {
        yield "The AI model is currently paused. Please try again later or contact support.";
      } else {
        yield "I apologize, but I encountered an error while generating the answer. Please try again.";
      }
    }
  }
}
