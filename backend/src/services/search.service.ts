import { Injectable } from "@nestjs/common";
import { HuggingFaceApi } from "../api/huggingface-api";
import { cosineSimilarity } from "../utils/cosine-similarity.util";
import { keywordSearchMetadata } from "../utils/keyword-search.util";
import { ArticleMetadata } from "../interfaces/article-metadata.interface";

@Injectable()
export class SearchService {
  private readonly hfApi: HuggingFaceApi;

  constructor() {
    this.hfApi = new HuggingFaceApi();
  }

  async findRelevantArticlesMetadata(
    query: string,
    articles: ArticleMetadata[],
    limit: number = 5
  ): Promise<ArticleMetadata[]> {
    try {
      const queryEmbedding = await this.hfApi.getEmbedding(query);

      const articlesWithSimilarity = await Promise.all(
        articles.map(async (article) => {
          const articleText = `${article.title} ${article.description}`;
          const articleEmbedding = await this.hfApi.getEmbedding(articleText);
          const similarity = cosineSimilarity(queryEmbedding, articleEmbedding);
          return { article, similarity };
        })
      );

      return articlesWithSimilarity
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, limit)
        .map((item) => item.article);
    } catch (error) {
      console.error("Search error:", error);
      return keywordSearchMetadata(query, articles, limit);
    }
  }
}
