import { Injectable } from "@nestjs/common";
import { RssApi } from "../api/rss-api";
import { WebScraperApi } from "../api/web-scraper-api";
import { NewsArticle, NewsSource } from "../interfaces/news.interface";
import { ArticleMetadata } from "../interfaces/article-metadata.interface";

@Injectable()
export class NewsService {
  private articleMetadata: ArticleMetadata[] = [];
  private lastMetadataFetchTime: number = 0;
  private readonly rssApi: RssApi;
  private readonly webScraperApi: WebScraperApi;
  private readonly sources: NewsSource[] = [
    {
      name: "The Defiant",
      rssUrl: "https://thedefiant.io/feed",
      baseUrl: "https://thedefiant.io",
    },
  ];
  private readonly METADATA_CACHE_DURATION = 1800000;

  constructor() {
    this.rssApi = new RssApi();
    this.webScraperApi = new WebScraperApi();
  }

  async ensureMetadataFetched(): Promise<void> {
    const now = Date.now();
    const timeSinceLastFetch = now - this.lastMetadataFetchTime;

    if (
      this.articleMetadata.length === 0 ||
      timeSinceLastFetch > this.METADATA_CACHE_DURATION
    ) {
      await this.fetchMetadataFromRSS();
    }
  }

  private async fetchMetadataFromRSS(): Promise<void> {
    console.log("Fetching article metadata from RSS feeds...");
    const allMetadata: ArticleMetadata[] = [];

    for (const source of this.sources) {
      const metadata = await this.rssApi.fetchMetadataFromSource(source);
      allMetadata.push(...metadata);
    }

    this.articleMetadata = allMetadata.sort(
      (a, b) => b.publishedAt.getTime() - a.publishedAt.getTime()
    );
    this.lastMetadataFetchTime = Date.now();
    console.log(`Fetched metadata for ${this.articleMetadata.length} articles`);
  }

  getArticleMetadata(): ArticleMetadata[] {
    return this.articleMetadata;
  }

  async fetchArticleContent(article: ArticleMetadata): Promise<NewsArticle> {
    return this.webScraperApi.fetchArticleContent(article);
  }

  async fetchArticlesContent(
    articles: ArticleMetadata[]
  ): Promise<NewsArticle[]> {
    const promises = articles.map((article) =>
      this.fetchArticleContent(article)
    );
    return Promise.all(promises);
  }
}
