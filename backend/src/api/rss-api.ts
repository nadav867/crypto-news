import Parser from "rss-parser";
import { NewsSource } from "../interfaces/news.interface";
import { ArticleMetadata } from "../interfaces/article-metadata.interface";

export class RssApi {
  private parser: Parser;

  constructor() {
    this.parser = new Parser();
  }

  async fetchMetadataFromSource(source: NewsSource): Promise<ArticleMetadata[]> {
    try {
      const feed = await this.parser.parseURL(source.rssUrl);
      return feed.items.slice(0, 30).map((item) => ({
        id: `${source.name}-${item.guid || item.link}`,
        title: item.title || "",
        description: item.contentSnippet || item.content || "",
        url: item.link || "",
        source: source.name,
        publishedAt: item.pubDate ? new Date(item.pubDate) : new Date(),
      }));
    } catch (error: any) {
      console.error(
        `Error fetching metadata from ${source.name}:`,
        error.message
      );
      return [];
    }
  }
}

