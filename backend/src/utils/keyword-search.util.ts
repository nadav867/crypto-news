import { ArticleMetadata } from "../interfaces/article-metadata.interface";

export function keywordSearchMetadata(
  query: string,
  articles: ArticleMetadata[],
  limit: number
): ArticleMetadata[] {
  const queryLower = query.toLowerCase();
  const queryWords = queryLower.split(/\s+/);

  const scoredArticles = articles.map((article) => {
    const text = `${article.title} ${article.description}`.toLowerCase();
    let score = 0;

    for (const word of queryWords) {
      if (word.length > 2) {
        const regex = new RegExp(word, "gi");
        const matches = text.match(regex);
        score += matches ? matches.length : 0;
      }
    }

    return { article, score };
  });

  return scoredArticles
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((item) => item.article);
}

