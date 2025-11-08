import { Controller, Get, Query, Res, HttpStatus } from "@nestjs/common";
import { Response } from "express";
import { AppService } from "./app.service";
import { ModerationService } from "./services/moderation.service";
import { NewsService } from "./services/news.service";
import { SearchService } from "./services/search.service";
import { LlmService } from "./services/llm.service";
import { setSSEHeaders } from "./utils/sse-headers.util";

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

    const isOffensive = await this.moderationService.isOffensive(question);
    if (isOffensive) {
      res.status(HttpStatus.BAD_REQUEST).json({
        error: "Your question contains inappropriate content",
      });
      return;
    }

    setSSEHeaders(res);

    try {
      await this.newsService.ensureMetadataFetched();

      const articleMetadata = this.newsService.getArticleMetadata();

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

      console.log("Crawling full content for relevant articles...");
      const relevantArticles =
        await this.newsService.fetchArticlesContent(relevantMetadata);

      for await (const chunk of this.llmService.generateAnswer(
        question,
        relevantArticles
      )) {
        console.log("Chunk:", chunk);
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
