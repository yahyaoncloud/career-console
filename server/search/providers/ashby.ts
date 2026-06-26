import axios from 'axios';
import type { CandidateUrl } from '../../crawler/types.js';

// Cloud/DevOps-focused companies using Ashby ATS
const ASHBY_COMPANIES = [
  'dbt-labs',
  'clickhouse',
  'turboml',
  'inngest',
  'trigger',
  'resend',
  'posthog',
  'metabase',
  'lago',
  'hatchet',
  'encore',
  'buf',
  'loft-sh',
  'vantage',
];

interface AshbyJob {
  id: string;
  title: string;
  teamName: string;
  isRemote: boolean;
  locationName: string;
  jobUrl: string;
}

interface AshbyApiResponse {
  jobs: AshbyJob[];
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

export async function fetchAshbyJobs(): Promise<CandidateUrl[]> {
  const results: CandidateUrl[] = [];

  for (const company of ASHBY_COMPANIES) {
    try {
      const apiUrl = `https://jobs.ashbyhq.com/api/non-user-graphql`;
      const response = await axios.post<AshbyApiResponse>(
        apiUrl,
        {
          operationName: 'ApiJobBoardWithTeams',
          variables: { organizationHostedJobsPageName: company },
          query: `query ApiJobBoardWithTeams($organizationHostedJobsPageName: String!) {
            jobBoard: jobBoardWithTeams(organizationHostedJobsPageName: $organizationHostedJobsPageName) {
              jobPostings { id title teamName isRemote locationName jobUrl }
            }
          }`,
        },
        {
          timeout: 10000,
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'Mozilla/5.0 (compatible; JobAggregator/1.0)',
          },
        }
      );

      const jobs: AshbyJob[] = response.data?.jobs || [];
      const filtered = jobs.filter(j => isCloudRole(j.title));

      for (const job of filtered.slice(0, 10)) {
        results.push({
          url: job.jobUrl || `https://jobs.ashbyhq.com/${company}/${job.id}`,
          source: `Ashby:${company}`,
          rawText: `TITLE: ${job.title}\nCOMPANY: ${company}\nTEAM: ${job.teamName}\nREMOTE: ${job.isRemote}\nLOCATION: ${job.locationName}`,
        });
      }

      if (filtered.length > 0) {
        console.log(`[Ashby] ${company}: ${filtered.length} cloud roles found`);
      }
    } catch (err: any) {
      if (err.response?.status !== 404) {
        console.warn(`[Ashby] Failed ${company}: ${err.message}`);
      }
    }
  }

  return results;
}
