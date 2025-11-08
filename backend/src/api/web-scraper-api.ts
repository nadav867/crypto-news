import axios from "axios";
import * as cheerio from "cheerio";
import { NewsArticle } from "../interfaces/news.interface";
import { ArticleMetadata } from "../interfaces/article-metadata.interface";

export class WebScraperApi {
  async fetchArticleContent(
    article: ArticleMetadata
  ): Promise<NewsArticle> {
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
}

