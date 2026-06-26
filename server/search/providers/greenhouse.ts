import axios from 'axios';
import type { CandidateUrl } from '../../crawler/types.js';

// Cloud/DevOps-focused companies using Greenhouse ATS
const GREENHOUSE_COMPANIES = [
  'hashicorp',
  'datadog',
  'cloudflare',
  'pagerduty',
  'grafana',
  'temporal',
  'pulumi',
  'cockroachdb',
  'planetscale',
  'tailscale',
  'weaveworks',
  'solo-io',
  'kubecost',
  'strongdm',
  'snyk',
  'chaossearch',
  'axiom',
  'prefect',
  'deepwatch',
  'nobl9',
];

interface GreenhouseJob {
  id: number;
  title: string;
  absolute_url: string;
  departments: { name: string }[];
  offices: { name: string; country: string }[];
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

export async function fetchGreenhouseJobs(): Promise<CandidateUrl[]> {
  const results: CandidateUrl[] = [];

  for (const company of GREENHOUSE_COMPANIES) {
    try {
      const url = `https://boards-api.greenhouse.io/v1/boards/${company}/jobs`;
      const response = await axios.get<{ jobs: GreenhouseJob[] }>(url, {
        timeout: 10000,
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; JobAggregator/1.0)' },
      });

      const jobs = response.data?.jobs || [];
      const filtered = jobs.filter(j => isCloudRole(j.title));

      for (const job of filtered.slice(0, 10)) {
        results.push({
          url: job.absolute_url,
          source: `Greenhouse:${company}`,
          rawText: `TITLE: ${job.title}\nCOMPANY: ${company}\nURL: ${job.absolute_url}\nDEPT: ${job.departments.map(d => d.name).join(', ')}\nLOCATION: ${job.offices.map(o => o.name).join(', ')}`,
        });
      }

      if (filtered.length > 0) {
        console.log(`[Greenhouse] ${company}: ${filtered.length} cloud roles found`);
      }
    } catch (err: any) {
      // Many companies won't have Greenhouse boards — silently skip 404s
      if (err.response?.status !== 404) {
        console.warn(`[Greenhouse] Failed ${company}: ${err.message}`);
      }
    }
  }

  return results;
}
