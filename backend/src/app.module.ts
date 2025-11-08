import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { NewsService } from "./services/news.service";
import { SearchService } from "./services/search.service";
import { LlmService } from "./services/llm.service";
import { ModerationService } from "./services/moderation.service";
import { HuggingFaceApi } from "./api/huggingface-api";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ".env",
    }),
  ],
  controllers: [AppController],
  providers: [
    AppService,
    NewsService,
    SearchService,
    LlmService,
    ModerationService,
    HuggingFaceApi,
  ],
})
export class AppModule {}
