import axios from 'axios';
import type { CandidateUrl, CrawlResult } from './types.js';

const MAX_CONCURRENCY = 5;
const REQUEST_TIMEOUT = 15000;
const DELAY_MS = 500; // Respectful delay between requests

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Lightweight HTTP crawler using axios + cheerio.
 * Crawls the given candidate URLs concurrently (capped at MAX_CONCURRENCY),
 * with polite rate limiting and retries.
 */
export async function crawlPages(candidates: CandidateUrl[]): Promise<CrawlResult[]> {
  console.log(`[Crawler] Starting crawl of ${candidates.length} URLs (concurrency: ${MAX_CONCURRENCY})`);

  const results: CrawlResult[] = [];
  const queue = [...candidates];
  let active = 0;

  const crawlOne = async (candidate: CandidateUrl): Promise<CrawlResult> => {
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const response = await axios.get(candidate.url, {
          timeout: REQUEST_TIMEOUT,
          maxRedirects: 5,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
          },
        });

        return {
          url: candidate.url,
          source: candidate.source,
          html: typeof response.data === 'string' ? response.data : JSON.stringify(response.data),
          statusCode: response.status,
        };
      } catch (err: any) {
        if (attempt === 2) {
          console.warn(`[Crawler] Failed ${candidate.url}: ${err.message}`);
          return {
            url: candidate.url,
            source: candidate.source,
            html: candidate.rawText || '',
            statusCode: err.response?.status || 0,
            error: err.message,
          };
        }
        await sleep(1000 * attempt);
      }
    }

    // Fallback (should never reach here due to loop)
    return {
      url: candidate.url,
      source: candidate.source,
      html: candidate.rawText || '',
      statusCode: 0,
      error: 'Max retries exceeded',
    };
  };

  // Process in batches of MAX_CONCURRENCY
  const batchSize = MAX_CONCURRENCY;
  for (let i = 0; i < queue.length; i += batchSize) {
    const batch = queue.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map(crawlOne));
    results.push(...batchResults);
    console.log(`[Crawler] Progress: ${Math.min(i + batchSize, queue.length)}/${queue.length}`);
    if (i + batchSize < queue.length) {
      await sleep(DELAY_MS);
    }
  }

  const successful = results.filter(r => !r.error).length;
  console.log(`[Crawler] Complete: ${successful}/${results.length} pages crawled successfully`);
  return results;
}
