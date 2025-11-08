import { Injectable } from "@nestjs/common";
import { InferenceClient } from "@huggingface/inference";

interface ArticleMetadata {
  id: string;
  title: string;
  description: string;
  url: string;
  source: string;
  publishedAt: Date;
  content?: string;
}

@Injectable()
export class SearchService {
  private readonly hf: InferenceClient;

  constructor() {
    const apiKey =
      process.env.HUGGINGFACE_API_KEY ||
      "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";
    this.hf = new InferenceClient(apiKey);
  }

  /**
   * Find relevant articles based on metadata (title + description)
   * This is fast because we only search metadata, not full content
   */
  async findRelevantArticlesMetadata(
    query: string,
    articles: ArticleMetadata[],
    limit: number = 5
  ): Promise<ArticleMetadata[]> {
    try {
      // Get embeddings for query
      const queryEmbedding = await this.getEmbedding(query);

      // Calculate similarity for each article using title + description
      const articlesWithSimilarity = await Promise.all(
        articles.map(async (article) => {
          const articleText = `${article.title} ${article.description}`;
          const articleEmbedding = await this.getEmbedding(articleText);
          const similarity = this.cosineSimilarity(
            queryEmbedding,
            articleEmbedding
          );
          return { article, similarity };
        })
      );

      // Sort by similarity and return top results
      return articlesWithSimilarity
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, limit)
        .map((item) => item.article);
    } catch (error) {
      console.error("Search error:", error);
      // Fallback: simple keyword-based search on metadata
      return this.keywordSearchMetadata(query, articles, limit);
    }
  }

  private async getEmbedding(text: string): Promise<number[]> {
    try {
      // Use Hugging Face library for embeddings
      const response = await this.hf.featureExtraction({
        // 💡 You MUST explicitly set a stable model for Feature Extraction
        model: "BAAI/bge-small-en-v1.5",
        inputs: text,
      });
      // Handle response from Hugging Face library
      if (Array.isArray(response)) {
        // If response is array of arrays, return first embedding
        if (Array.isArray(response[0])) {
          return response[0] as number[];
        }
        // If response is array of numbers, return as is
        if (typeof response[0] === "number") {
          return response as number[];
        }
        // Otherwise return first element as array
        return response[0] as unknown as number[];
      }
      // If response is a single array/number array, return it
      return response as unknown as number[];
    } catch (error: any) {
      // If router fails, try fallback to keyword search
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

  private keywordSearchMetadata(
    query: string,
    articles: ArticleMetadata[],
    limit: number
  ): ArticleMetadata[] {
    const queryLower = query.toLowerCase();
    const queryWords = queryLower.split(/\s+/);

    const scoredArticles = articles.map((article) => {
      const text = `${article.title} ${article.description}`.toLowerCase();
      let score = 0;

      for (const word of queryWords) {
        if (word.length > 2) {
          // Count occurrences
          const regex = new RegExp(word, "gi");
          const matches = text.match(regex);
          score += matches ? matches.length : 0;
        }
      }

      return { article, score };
    });

    return scoredArticles
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map((item) => item.article);
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    if (!a || !b || a.length !== b.length) return 0;

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    const denominator = Math.sqrt(normA) * Math.sqrt(normB);
    return denominator === 0 ? 0 : dotProduct / denominator;
  }
}
