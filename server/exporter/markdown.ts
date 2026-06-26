import fs from 'fs';
import path from 'path';
import type { ExtractedJob } from '../extractor/types.js';

const JOBS_DIR = path.join(process.cwd(), 'content', 'jobs');

function ensureJobsDir(): void {
  if (!fs.existsSync(JOBS_DIR)) {
    fs.mkdirSync(JOBS_DIR, { recursive: true });
  }
}

function formatJobMarkdown(job: ExtractedJob): string {
  const remoteTag = job.remote ? '🌐 Remote' : '🏢 On-site';
  const salary = job.salary ? `**💰 Salary:** ${job.salary}  ` : '';
  const visa = job.visaSponsorship ? `**🛂 Visa:** ${job.visaSponsorship}  ` : '';
  const skills = job.skills.length > 0 ? `**🔧 Skills:** ${job.skills.join(', ')}  ` : '';
  const preferred = job.preferredSkills.length > 0 ? `**✨ Preferred:** ${job.preferredSkills.join(', ')}  ` : '';

  return `### [${job.title}](${job.url})
**🏢 ${job.company}** | ${remoteTag} | ${job.location || 'Location not specified'}
**📋 Type:** ${job.employmentType || 'Not specified'} | **🎓 Level:** ${job.experienceLevel || 'Not specified'}
${salary}${visa}

**📝 Summary:** ${job.summary}

${skills}${preferred}
**Source:** ${job.source} | **Scraped:** ${new Date(job.scrapedAt).toLocaleDateString()}`;
}

export function writeJobsMarkdown(jobs: ExtractedJob[], dateStr: string): string {
  ensureJobsDir();

  const remoteCount = jobs.filter(j => j.remote).length;
  const companies = new Set(jobs.map(j => j.company)).size;

  const header = `---
title: Daily Cloud Jobs Report - ${dateStr}
date: ${dateStr}
excerpt: ${jobs.length} curated Cloud, DevOps, and Infrastructure job listings — ${remoteCount} remote positions from ${companies} companies.
tags: cloud, devops, jobs, automation, infrastructure
---

# 🚀 Daily Cloud Jobs Report — ${dateStr}

> **${jobs.length} Jobs** | **${remoteCount} Remote** | **${companies} Companies**

---

`;

  const jobSections = jobs.map(formatJobMarkdown).join('\n\n---\n\n');
  const content = header + jobSections + '\n';

  const slug = `daily-cloud-jobs-${dateStr}`;
  const filePath = path.join(JOBS_DIR, `${slug}.md`);
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`[Exporter:Markdown] Written ${jobs.length} jobs to ${filePath}`);
  return filePath;
}
