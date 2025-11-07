import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { NewsService } from "./services/news.service";
import { SearchService } from "./services/search.service";
import { LlmService } from "./services/llm.service";
import { ModerationService } from "./services/moderation.service";

@Module({
  imports: [],
  controllers: [AppController],
  providers: [
    AppService,
    NewsService,
    SearchService,
    LlmService,
    ModerationService,
  ],
})
export class AppModule {}
