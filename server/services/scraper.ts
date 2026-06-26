/**
 * Job Scraper Orchestrator
 *
 * This is the main entry point for the job aggregation pipeline.
 * Each stage is isolated in its own module under server/
 *
 * Pipeline:
 *   Search (Discovery) → Crawler → Cleaner → AI Extractor → Deduplicator → Exporter → Telegram
 */

import { discoverJobs } from '../search/index.js';
import { crawlPages } from '../crawler/index.js';
import { cleanHtml, cleanRawText } from '../parser/cleaner.js';
import { extractJobs } from '../extractor/index.js';
import { deduplicateJobs } from '../deduplicator/index.js';
import { writeJobsJson } from '../exporter/json.js';
import { writeJobsMarkdown } from '../exporter/markdown.js';
import { writeJobsExcel } from '../exporter/excel.js';
import { sendTelegramReport } from '../integrations/telegram.js';
import type { ExtractionInput } from '../extractor/types.js';

export { scheduleScraper } from '../scheduler/index.js';

export const runJobScraper = async (requestedModel = 'gemini-2.5-pro'): Promise<void> => {
  const startTime = Date.now();
  const dateStr = new Date().toISOString().split('T')[0];
  console.log(`\n${'='.repeat(60)}`);
  console.log(`[Scraper] Pipeline started — ${dateStr} — model: ${requestedModel}`);
  console.log(`${'='.repeat(60)}\n`);

  try {
    // ─── Stage 1: Discovery ────────────────────────────────────────
    const candidates = await discoverJobs();
    console.log(`\n[Stage 1 ✓] Discovered ${candidates.length} candidate URLs`);

    if (candidates.length === 0) {
      console.log('[Scraper] No candidates found. Exiting pipeline.');
      return;
    }

    // ─── Stage 2: Crawl ───────────────────────────────────────────
    // For candidates with pre-fetched rawText (RSS/ATS API), skip crawling
    const needsCrawl = candidates.filter(c => !c.rawText || c.rawText.length < 100);
    const hasRawText = candidates.filter(c => c.rawText && c.rawText.length >= 100);

    console.log(`\n[Stage 2] Crawling ${needsCrawl.length} pages (${hasRawText.length} pre-fetched from APIs)`);
    const crawlResults = needsCrawl.length > 0 ? await crawlPages(needsCrawl) : [];
    console.log(`[Stage 2 ✓] Crawl complete`);

    // ─── Stage 3: Clean ───────────────────────────────────────────
    const inputs: ExtractionInput[] = [
      // Clean HTML from crawled pages
      ...crawlResults.map(r => ({
        url: r.url,
        source: r.source,
        cleanedText: r.html ? cleanHtml(r.html, r.url) : `SOURCE_URL: ${r.url}\n[Crawl failed]`,
      })),
      // Use raw text for pre-fetched items
      ...hasRawText.map(c => ({
        url: c.url,
        source: c.source,
        cleanedText: cleanRawText(c.rawText!, c.url),
      })),
    ];
    console.log(`\n[Stage 3 ✓] Cleaned ${inputs.length} content items`);

    // ─── Stage 4: AI Extraction ────────────────────────────────────
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not set. Cannot run AI extraction.');
    }
    const extracted = await extractJobs(inputs, requestedModel);
    console.log(`\n[Stage 4 ✓] Extracted ${extracted.length} jobs from AI`);

    if (extracted.length === 0) {
      console.log('[Scraper] No jobs extracted. Writing empty report.');
    }

    // ─── Stage 5: Deduplication ────────────────────────────────────
    const unique = deduplicateJobs(extracted);
    console.log(`\n[Stage 5 ✓] ${unique.length} unique jobs after deduplication`);

    // ─── Stage 6: Export ───────────────────────────────────────────
    console.log(`\n[Stage 6] Exporting...`);
    await Promise.all([
      writeJobsJson(unique, dateStr),
      writeJobsMarkdown(unique, dateStr),
      writeJobsExcel(unique, dateStr),
    ]);
    console.log(`[Stage 6 ✓] All exports written`);

    // ─── Stage 7: Telegram ────────────────────────────────────────
    await sendTelegramReport(unique, dateStr);
    console.log(`\n[Stage 7 ✓] Telegram report sent`);

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`\n${'='.repeat(60)}`);
    console.log(`[Scraper] Pipeline complete in ${elapsed}s — ${unique.length} unique jobs`);
    console.log(`${'='.repeat(60)}\n`);

  } catch (error: any) {
    console.error(`\n[Scraper] Pipeline error: ${error.message}`, error);
  }
};
