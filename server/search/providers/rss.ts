import axios from 'axios';
import * as cheerio from 'cheerio';
import type { CandidateUrl } from '../../crawler/types.js';

interface RssFeed {
  url: string;
  source: string;
}

const RSS_FEEDS: RssFeed[] = [
  { url: 'https://weworkremotely.com/categories/remote-devops-sysadmin-jobs.rss', source: 'WeWorkRemotely:DevOps' },
  { url: 'https://weworkremotely.com/categories/remote-back-end-programming-jobs.rss', source: 'WeWorkRemotely:Backend' },
  { url: 'https://remoteok.com/remote-devops-jobs.rss', source: 'RemoteOK:DevOps' },
  { url: 'https://remoteok.com/remote-cloud-jobs.rss', source: 'RemoteOK:Cloud' },
  { url: 'https://remoteok.com/remote-sre-jobs.rss', source: 'RemoteOK:SRE' },
  { url: 'https://remoteok.com/remote-infrastructure-jobs.rss', source: 'RemoteOK:Infrastructure' },
  { url: 'https://jobicy.com/?feed=job_feed&job_categories=devops&job_types=full-time', source: 'Jobicy:DevOps' },
  { url: 'https://jobicy.com/?feed=job_feed&job_categories=sysadmin', source: 'Jobicy:SysAdmin' },
  { url: 'https://www.workingnomads.com/jobs?category=devops&format=rss', source: 'WorkingNomads:DevOps' },
  { url: 'https://himalayas.app/jobs/devops/feed', source: 'Himalayas:DevOps' },
  { url: 'https://himalayas.app/jobs/cloud/feed', source: 'Himalayas:Cloud' },
];

export async function fetchRssFeeds(): Promise<CandidateUrl[]> {
  const results: CandidateUrl[] = [];

  for (const feed of RSS_FEEDS) {
    try {
      console.log(`[RSS] Fetching ${feed.source}: ${feed.url}`);
      const response = await axios.get(feed.url, {
        timeout: 15000,
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; JobAggregator/1.0)' },
      });

      const $ = cheerio.load(response.data, { xmlMode: true });

      $('item').each((i, el) => {
        // Cap at 20 items per feed
        if (i >= 20) return false;

        const title = $(el).find('title').first().text().trim();
        const link = $(el).find('link').first().text().trim() || $(el).find('url').first().text().trim();
        const desc = $(el).find('description').first().text().trim();

        if (!link || !link.startsWith('http')) return;

        // Pre-filter: skip obviously non-job items
        const combined = (title + ' ' + desc).toLowerCase();
        if (
          combined.includes('category') ||
          combined.includes('newsletter') ||
          combined.includes('blog') ||
          combined.includes('podcast')
        ) return;

        results.push({
          url: link,
          source: feed.source,
          rawText: `TITLE: ${title}\nURL: ${link}\nDESCRIPTION: ${desc.substring(0, 500)}`,
        });
      });

      console.log(`[RSS] ${feed.source}: discovered ${$('item').length} items`);
    } catch (err: any) {
      console.warn(`[RSS] Failed to fetch ${feed.source}: ${err.message}`);
    }
  }

  return results;
}
