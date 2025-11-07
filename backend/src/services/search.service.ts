import { Injectable } from '@nestjs/common';
import axios from 'axios';

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
  private readonly apiUrl = 'https://api-inference.huggingface.co/models';
  private readonly embeddingModel = 'sentence-transformers/all-MiniLM-L6-v2'; // Free embedding model
  private readonly apiKey = process.env.HUGGINGFACE_API_KEY || '';

  /**
   * Find relevant articles based on metadata (title + description)
   * This is fast because we only search metadata, not full content
   */
  async findRelevantArticlesMetadata(
    query: string,
    articles: ArticleMetadata[],
    limit: number = 5,
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
            articleEmbedding,
          );
          return { article, similarity };
        }),
      );

      // Sort by similarity and return top results
      return articlesWithSimilarity
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, limit)
        .map((item) => item.article);
    } catch (error) {
      console.error('Search error:', error);
      // Fallback: simple keyword-based search on metadata
      return this.keywordSearchMetadata(query, articles, limit);
    }
  }

  private async getEmbedding(text: string): Promise<number[]> {
    try {
      const response = await axios.post(
        `${this.apiUrl}/${this.embeddingModel}`,
        { inputs: text },
        {
          headers: {
            'Content-Type': 'application/json',
            ...(this.apiKey && { Authorization: `Bearer ${this.apiKey}` }),
          },
        },
      );

      // Handle different response formats
      if (Array.isArray(response.data)) {
        return response.data[0];
      }
      if (response.data.embeddings) {
        return response.data.embeddings[0];
      }
      return response.data;
    } catch (error) {
      console.error('Embedding error:', error);
      throw error;
    }
  }

  private keywordSearchMetadata(
    query: string,
    articles: ArticleMetadata[],
    limit: number,
  ): ArticleMetadata[] {
    const queryLower = query.toLowerCase();
    const queryWords = queryLower.split(/\s+/);

    const scoredArticles = articles.map((article) => {
      const text = `${article.title} ${article.description}`.toLowerCase();
      let score = 0;

      for (const word of queryWords) {
        if (word.length > 2) {
          // Count occurrences
          const regex = new RegExp(word, 'gi');
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

