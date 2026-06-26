import { fetchRssFeeds } from './providers/rss.js';
import { fetchGreenhouseJobs } from './providers/greenhouse.js';
import { fetchLeverJobs } from './providers/lever.js';
import { fetchAshbyJobs } from './providers/ashby.js';
import type { CandidateUrl } from '../crawler/types.js';

export async function discoverJobs(): Promise<CandidateUrl[]> {
  console.log('[Search] Starting multi-source job discovery...');

  // Run all providers in parallel for speed
  const [rssJobs, greenhouseJobs, leverJobs, ashbyJobs] = await Promise.allSettled([
    fetchRssFeeds(),
    fetchGreenhouseJobs(),
    fetchLeverJobs(),
    fetchAshbyJobs(),
  ]);

  const allCandidates: CandidateUrl[] = [
    ...(rssJobs.status === 'fulfilled' ? rssJobs.value : []),
    ...(greenhouseJobs.status === 'fulfilled' ? greenhouseJobs.value : []),
    ...(leverJobs.status === 'fulfilled' ? leverJobs.value : []),
    ...(ashbyJobs.status === 'fulfilled' ? ashbyJobs.value : []),
  ];

  // Deduplicate by URL at the discovery stage
  const seen = new Set<string>();
  const unique = allCandidates.filter(c => {
    const normalized = c.url.toLowerCase().trim().replace(/\/$/, '');
    if (seen.has(normalized)) return false;
    seen.add(normalized);
    return true;
  });

  console.log(`[Search] Discovery complete: ${unique.length} unique candidates from ${allCandidates.length} total`);

  // Cap total candidates — with batch size 30, this = 2 API calls (well within free tier 20/day)
  const MAX_CANDIDATES = 60;
  return unique.slice(0, MAX_CANDIDATES);
}
