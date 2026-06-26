import fs from 'fs';
import path from 'path';
import type { ExtractedJob } from '../extractor/types.js';

const JOBS_DIR = path.join(process.cwd(), 'content', 'jobs');

function ensureJobsDir(): void {
  if (!fs.existsSync(JOBS_DIR)) {
    fs.mkdirSync(JOBS_DIR, { recursive: true });
  }
}

export function writeJobsJson(jobs: ExtractedJob[], dateStr: string): string {
  ensureJobsDir();
  const filePath = path.join(JOBS_DIR, `jobs-${dateStr}.json`);
  fs.writeFileSync(
    filePath,
    JSON.stringify({ generated: new Date().toISOString(), count: jobs.length, jobs }, null, 2),
    'utf8'
  );
  console.log(`[Exporter:JSON] Written ${jobs.length} jobs to ${filePath}`);
  return filePath;
}
