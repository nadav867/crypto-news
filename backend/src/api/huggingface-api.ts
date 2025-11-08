import { InferenceClient } from "@huggingface/inference";
import { parseEmbeddingResponse } from "../utils/embedding-response-parser.util";

export class HuggingFaceApi {
  private readonly hf: InferenceClient;

  constructor() {
    const apiKey =
      process.env.HUGGINGFACE_API_KEY ||
      "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";
    this.hf = new InferenceClient(apiKey);
  }

  async getEmbedding(text: string): Promise<number[]> {
    try {
      const response = await this.hf.featureExtraction({
        model: "BAAI/bge-small-en-v1.5",
        inputs: text,
      });
      return parseEmbeddingResponse(response);
    } catch (error: any) {
      console.error("Embedding error:", error.response?.data || error.message);
      console.error("Embedding error details:", {
        message: error?.message,
        status: error?.status,
        responseStatus: error?.response?.status,
        responseData: error?.response?.data,
        httpRequest: error?.httpRequest,
        httpResponse: error?.httpResponse,
      });
      throw error;
    }
  }

  async chatCompletion(prompt: string): Promise<string> {
    const response = await this.hf.chatCompletion({
      model: "mistralai/Mistral-7B-Instruct-v0.2",
      provider: "featherless-ai",
      messages: [{ role: "user", content: prompt }],
      parameters: {
        max_new_tokens: 512,
      },
    });

    console.log("Response:", response.choices[0].message.content);
    return response.choices[0].message.content || "";
  }
}

