import { Controller, Get, Query, Res, HttpStatus } from "@nestjs/common";
import { Response } from "express";
import { AppService } from "./app.service";
import { ModerationService } from "./services/moderation.service";
import { NewsService } from "./services/news.service";
import { SearchService } from "./services/search.service";
import { LlmService } from "./services/llm.service";

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly moderationService: ModerationService,
    private readonly newsService: NewsService,
    private readonly searchService: SearchService,
    private readonly llmService: LlmService
  ) {}

  @Get("ask")
  async ask(@Query("q") question: string, @Res() res: Response): Promise<void> {
    console.log("Question:", question);
    if (!question || question.trim().length === 0) {
      res.status(HttpStatus.BAD_REQUEST).json({
        error: 'Question parameter "q" is required',
      });
      return;
    }

    // Check moderation
    const isOffensive = await this.moderationService.isOffensive(question);
    if (isOffensive) {
      res.status(HttpStatus.BAD_REQUEST).json({
        error: "Your question contains inappropriate content",
      });
      return;
    }

    // Set up SSE headers
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("Access-Control-Allow-Origin", "*");

    try {
      // Step 1: Fetch lightweight metadata from RSS feeds (fast, no crawling)
      await this.newsService.ensureMetadataFetched();

      // Step 2: Get article metadata for semantic search
      const articleMetadata = this.newsService.getArticleMetadata();

      // Step 3: Find relevant articles using semantic search on metadata
      const relevantMetadata =
        await this.searchService.findRelevantArticlesMetadata(
          question,
          articleMetadata,
          5
        );

      console.log(`Found ${relevantMetadata.length} relevant articles`);

      if (relevantMetadata.length === 0) {
        res.write(
          `data: ${JSON.stringify({ type: "error", message: "No relevant news articles found" })}\n\n`
        );
        res.end();
        return;
      }

      // Step 4: Only now crawl full content for relevant articles
      console.log("Crawling full content for relevant articles...");
      const relevantArticles =
        await this.newsService.fetchArticlesContent(relevantMetadata);

      // Step 5: Generate answer using LLM with full article content
      for await (const chunk of this.llmService.generateAnswer(
        question,
        relevantArticles
      )) {
        res.write(
          `data: ${JSON.stringify({ type: "chunk", content: chunk })}\n\n`
        );
      }

      res.write(`data: ${JSON.stringify({ type: "done" })}\n\n`);
      res.end();
    } catch (error) {
      console.error("Error in /ask endpoint:", error);
      res.write(
        `data: ${JSON.stringify({ type: "error", message: "An error occurred while generating the answer" })}\n\n`
      );
      res.end();
    }
  }
}
