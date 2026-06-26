import fs from 'fs';
import path from 'path';
import type { ExtractedJob } from '../extractor/types.js';

const SEEN_URLS_FILE = path.join(process.cwd(), 'content', 'jobs', 'seen-urls.json');

function loadSeenUrls(): Set<string> {
  try {
    if (fs.existsSync(SEEN_URLS_FILE)) {
      const data = JSON.parse(fs.readFileSync(SEEN_URLS_FILE, 'utf8'));
      return new Set<string>(Array.isArray(data) ? data : []);
    }
  } catch (err: any) {
    console.warn(`[Deduplicator] Failed to load seen URLs: ${err.message}`);
  }
  return new Set<string>();
}

function saveSeenUrls(urls: Set<string>): void {
  try {
    const dir = path.dirname(SEEN_URLS_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(SEEN_URLS_FILE, JSON.stringify([...urls], null, 2), 'utf8');
  } catch (err: any) {
    console.warn(`[Deduplicator] Failed to save seen URLs: ${err.message}`);
  }
}

function normalizeKey(job: ExtractedJob): string {
  return `${job.title.toLowerCase().trim()}|${job.company.toLowerCase().trim()}`;
}

function normalizeUrl(url: string): string {
  return url.toLowerCase().trim().replace(/\/$/, '').split('?')[0];
}

/**
 * Removes duplicate jobs based on:
 * 1. Exact canonical URL (cross-run incremental dedup)
 * 2. Normalized title+company string (within this run)
 * 
 * Persists seen URLs to disk for incremental runs.
 */
export function deduplicateJobs(jobs: ExtractedJob[]): ExtractedJob[] {
  const seenUrls = loadSeenUrls();
  const seenKeys = new Set<string>();
  const unique: ExtractedJob[] = [];

  for (const job of jobs) {
    const urlKey = normalizeUrl(job.url);
    const titleKey = normalizeKey(job);

    if (seenUrls.has(urlKey)) {
      console.log(`[Deduplicator] Skipping already-seen URL: ${job.url}`);
      continue;
    }

    if (seenKeys.has(titleKey)) {
      console.log(`[Deduplicator] Skipping duplicate title+company: ${job.title} @ ${job.company}`);
      continue;
    }

    seenUrls.add(urlKey);
    seenKeys.add(titleKey);
    unique.push(job);
  }

  // Persist new URLs for future runs
  saveSeenUrls(seenUrls);

  console.log(`[Deduplicator] ${unique.length} unique jobs (removed ${jobs.length - unique.length} duplicates)`);
  return unique;
}
