import axios from 'axios';
import type { CandidateUrl } from '../../crawler/types.js';

// Cloud/DevOps-focused companies using Lever ATS
const LEVER_COMPANIES = [
  'canonical',
  'fastly',
  'netlify',
  'vercel',
  'render',
  'fly',
  'modal-labs',
  'dagger',
  'earthly',
  'depot',
  'turso',
  'neon',
  'supabase',
  'tigrisdata',
  'wundergraph',
  'coherence',
  'buildpacks',
  'massdriver',
];

interface LeverJob {
  id: string;
  text: string;
  hostedUrl: string;
  categories: {
    team?: string;
    location?: string;
    commitment?: string;
  };
}

const CLOUD_KEYWORDS = [
  'devops', 'cloud', 'platform', 'infrastructure', 'sre', 'site reliability',
  'kubernetes', 'terraform', 'aws', 'azure', 'gcp', 'linux', 'systems',
  'network', 'security engineer', 'solutions architect', 'support engineer',
];

function isCloudRole(title: string): boolean {
  const lower = title.toLowerCase();
  return CLOUD_KEYWORDS.some(kw => lower.includes(kw));
}

export async function fetchLeverJobs(): Promise<CandidateUrl[]> {
  const results: CandidateUrl[] = [];

  for (const company of LEVER_COMPANIES) {
    try {
      const url = `https://api.lever.co/v0/postings/${company}?mode=json&limit=50`;
      const response = await axios.get<LeverJob[]>(url, {
        timeout: 10000,
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; JobAggregator/1.0)' },
      });

      const jobs = Array.isArray(response.data) ? response.data : [];
      const filtered = jobs.filter(j => isCloudRole(j.text));

      for (const job of filtered.slice(0, 10)) {
        results.push({
          url: job.hostedUrl,
          source: `Lever:${company}`,
          rawText: `TITLE: ${job.text}\nCOMPANY: ${company}\nURL: ${job.hostedUrl}\nLOCATION: ${job.categories?.location || 'Remote'}\nTYPE: ${job.categories?.commitment || 'Full-time'}`,
        });
      }

      if (filtered.length > 0) {
        console.log(`[Lever] ${company}: ${filtered.length} cloud roles found`);
      }
    } catch (err: any) {
      if (err.response?.status !== 404) {
        console.warn(`[Lever] Failed ${company}: ${err.message}`);
      }
    }
  }

  return results;
}
