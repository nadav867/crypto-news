export interface NewsArticle {
  id: string;
  title: string;
  content: string;
  url: string;
  source: string;
  publishedAt: Date;
  embedding?: number[];
}

export interface NewsSource {
  name: string;
  rssUrl: string;
  baseUrl: string;
}
