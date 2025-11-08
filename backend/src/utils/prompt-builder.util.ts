import { NewsArticle } from "../interfaces/news.interface";

export function buildPrompt(question: string, articles: NewsArticle[]): string {
  const context = articles
    .map(
      (article) =>
        `Title: ${article.title}\nSource: ${article.source}\nContent: ${article.content.substring(0, 2000)}\nURL: ${article.url}`
    )
    .join("\n\n---\n\n");

  return `You are a helpful AI crypto journalist with access to the latest cryptocurrency news. Answer the user's question naturally and conversationally based on the information below.

          IMPORTANT: Do NOT mention that you received articles, documents, or any sources. Answer as if you naturally know this information. You may mention specific news sources (like "According to The Defiant" or "The Defiant reported") when citing information, but never mention receiving articles or documents.

          If the information below doesn't contain enough details to answer the question, simply say you don't have enough information about that topic.

          Recent crypto news information:

          ${context}

          Question: ${question}

          Answer:`;
}
