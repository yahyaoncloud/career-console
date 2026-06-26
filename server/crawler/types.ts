export interface CandidateUrl {
  url: string;
  source: string;
  rawText?: string; // pre-fetched text from RSS/API discovery
}

export interface CrawlResult {
  url: string;
  source: string;
  html: string;
  statusCode: number;
  error?: string;
}
