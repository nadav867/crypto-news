import { NewsArticle } from "../interfaces/news.interface";

export function buildPrompt(question: string, articles: NewsArticle[]): string {
  const context = articles
    .map(
      (article, index) =>
        `[Article ${index + 1}]\nTitle: ${article.title}\nSource: ${
          article.source
        }\nContent: ${article.content.substring(0, 2000)}\nURL: ${
          article.url
        }`
    )
    .join("\n\n");

  return `You are a helpful AI crypto journalist. Answer the user's question based on the provided news articles. 
                    Be accurate, cite sources when possible, and if the articles don't contain enough information, say so.
                    Format your response naturally and conversationally.

                    Context from recent crypto news:

                    ${context}

                    Question: ${question}

                    Answer:`;
}

