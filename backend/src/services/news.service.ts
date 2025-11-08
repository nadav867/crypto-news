import { Injectable } from "@nestjs/common";
import Parser from "rss-parser";
import axios from "axios";
import * as cheerio from "cheerio";
import { NewsArticle, NewsSource } from "../interfaces/news.interface";

interface ArticleMetadata {
  id: string;
  title: string;
  description: string;
  url: string;
  source: string;
  publishedAt: Date;
  content?: string; // Only fetched when needed
}

@Injectable()
export class NewsService {
  private articleMetadata: ArticleMetadata[] = [];
  private lastMetadataFetchTime: number = 0;
  private parser: Parser;
  private readonly sources: NewsSource[] = [
    {
      name: "The Defiant",
      rssUrl: "https://thedefiant.io/feed",
      baseUrl: "https://thedefiant.io",
    },
  ];
  private readonly METADATA_CACHE_DURATION = 1800000; // 30 minutes

  constructor() {
    this.parser = new Parser();
  }

  /**
   * Fetch lightweight metadata from RSS feeds (titles, descriptions, URLs)
   * This is fast and doesn't require crawling full articles
   */
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

  /**
   * Fetch only metadata from RSS feeds (no content crawling)
   */
  private async fetchMetadataFromRSS(): Promise<void> {
    console.log("Fetching article metadata from RSS feeds...");
    const allMetadata: ArticleMetadata[] = [];

    for (const source of this.sources) {
      try {
        const feed = await this.parser.parseURL(source.rssUrl);
        const metadata: ArticleMetadata[] = feed.items
          .slice(0, 30)
          .map((item) => ({
            id: `${source.name}-${item.guid || item.link}`,
            title: item.title || "",
            description: item.contentSnippet || item.content || "",
            url: item.link || "",
            source: source.name,
            publishedAt: item.pubDate ? new Date(item.pubDate) : new Date(),
          }));
        allMetadata.push(...metadata);
      } catch (error: any) {
        console.error(
          `Error fetching metadata from ${source.name}:`,
          error.message
        );
      }
    }

    this.articleMetadata = allMetadata.sort(
      (a, b) => b.publishedAt.getTime() - a.publishedAt.getTime()
    );
    this.lastMetadataFetchTime = Date.now();
    console.log(`Fetched metadata for ${this.articleMetadata.length} articles`);
  }

  /**
   * Get article metadata for semantic search
   * Returns lightweight data (no full content)
   */
  getArticleMetadata(): ArticleMetadata[] {
    return this.articleMetadata;
  }

  /**
   * Crawl and fetch full content for specific articles
   * Only called for articles that are relevant to the query
   */
  async fetchArticleContent(article: ArticleMetadata): Promise<NewsArticle> {
    // If content already fetched, return it
    if (article.content) {
      return {
        id: article.id,
        title: article.title,
        content: article.content,
        url: article.url,
        source: article.source,
        publishedAt: article.publishedAt,
      };
    }

    // Fetch full content
    try {
      const response = await axios.get(article.url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
        timeout: 5000,
      });

      const $ = cheerio.load(response.data);
      $("script, style").remove();
      const content =
        $("article").text() ||
        $(".article-content").text() ||
        $(".post-content").text() ||
        $("main").text() ||
        $("body").text();

      const fullContent = content.trim().substring(0, 5000);

      // Cache the content
      article.content = fullContent;

      return {
        id: article.id,
        title: article.title,
        content: fullContent || article.description,
        url: article.url,
        source: article.source,
        publishedAt: article.publishedAt,
      };
    } catch (error: any) {
      console.error(
        `Error fetching content from ${article.url}:`,
        error.message
      );
      // Return with description as fallback
      return {
        id: article.id,
        title: article.title,
        content: article.description,
        url: article.url,
        source: article.source,
        publishedAt: article.publishedAt,
      };
    }
  }

  /**
   * Fetch full content for multiple articles in parallel
   */
  async fetchArticlesContent(
    articles: ArticleMetadata[]
  ): Promise<NewsArticle[]> {
    const promises = articles.map((article) =>
      this.fetchArticleContent(article)
    );
    return Promise.all(promises);
  }
}
