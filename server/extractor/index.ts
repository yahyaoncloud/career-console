import { GoogleGenAI } from '@google/genai';
import { EXTRACTION_PROMPT } from './prompt.js';
import type { ExtractedJob, ExtractionInput } from './types.js';

/**
 * Batch size is large to minimize API calls against the free tier's 20 req/day limit.
 * Each batch = 1 API call. With 120 candidates and batch size 30 → only 4 calls.
 * Content per item is capped at 4000 chars by the cleaner, so total prompt stays safe.
 */
const BATCH_SIZE = 30;

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Parses the retryDelay from a Gemini 429 error body (e.g. "22s" → 22000ms).
 * Falls back to 30 seconds if not parseable.
 */
function parseRetryDelay(errMessage: string): number {
  const match = errMessage.match(/retry\s+in\s+([\d.]+)s/i);
  if (match) {
    const seconds = parseFloat(match[1]);
    return Math.ceil(seconds * 1000) + 2000; // add 2s buffer
  }
  return 35000; // safe default: 35s
}

/**
 * Calls Gemini with automatic retry on 429 RESOURCE_EXHAUSTED.
 * Respects the retryDelay from the error response.
 */
async function callGeminiWithRetry(
  ai: GoogleGenAI,
  model: string,
  prompt: string,
  maxRetries = 3
): Promise<string> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          thinkingConfig: { thinkingBudget: 0 },
        },
      });
      return result.text || '{"jobs":[]}';
    } catch (err: any) {
      const is429 = err?.message?.includes('429') || err?.message?.includes('RESOURCE_EXHAUSTED');
      if (is429 && attempt < maxRetries) {
        const waitMs = parseRetryDelay(err.message);
        console.warn(`[Extractor] Rate limited (429). Waiting ${(waitMs / 1000).toFixed(0)}s before retry ${attempt}/${maxRetries - 1}...`);
        await sleep(waitMs);
        continue;
      }
      throw err;
    }
  }
  throw new Error('Max retries exceeded');
}

/**
 * Extracts structured job data from cleaned content using Gemini.
 * Uses large batches (default 30 items) to stay within free tier quota.
 */
export async function extractJobs(
  inputs: ExtractionInput[],
  model: string
): Promise<ExtractedJob[]> {
  if (inputs.length === 0) return [];

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const allJobs: ExtractedJob[] = [];
  const now = new Date().toISOString();

  // Split into batches
  const batches: ExtractionInput[][] = [];
  for (let i = 0; i < inputs.length; i += BATCH_SIZE) {
    batches.push(inputs.slice(i, i + BATCH_SIZE));
  }

  console.log(`[Extractor] ${inputs.length} items → ${batches.length} batches of ${BATCH_SIZE} using ${model}`);
  console.log(`[Extractor] Estimated API calls: ${batches.length} (free tier limit: 20/day)`);

  for (let batchIdx = 0; batchIdx < batches.length; batchIdx++) {
    const batch = batches[batchIdx];
    console.log(`[Extractor] Batch ${batchIdx + 1}/${batches.length} (${batch.length} items)...`);

    // Concatenate all items with clear separators
    const batchContent = batch
      .map((item, i) => `=== JOB ${i + 1} | SOURCE: ${item.source} ===\n${item.cleanedText}`)
      .join('\n\n');

    const prompt = EXTRACTION_PROMPT + batchContent;

    try {
      let rawText = await callGeminiWithRetry(ai, model, prompt);
      rawText = rawText.replace(/```(?:json)?/gi, '').trim();

      const parsed = JSON.parse(rawText) as { jobs: any[] };

      if (parsed.jobs && Array.isArray(parsed.jobs)) {
        const enriched: ExtractedJob[] = parsed.jobs
          .filter((j: any) => j.title && j.company)
          .map((j: any) => ({
            title: j.title || '',
            company: j.company || '',
            employmentType: j.employmentType || null,
            experienceLevel: j.experienceLevel || null,
            remote: j.remote === true || String(j.remote).toLowerCase() === 'true',
            location: j.location || null,
            country: j.country || null,
            salary: j.salary || null,
            visaSponsorship: j.visaSponsorship || null,
            skills: Array.isArray(j.skills) ? j.skills : [],
            preferredSkills: Array.isArray(j.preferredSkills) ? j.preferredSkills : [],
            summary: j.summary || '',
            url: j.url || batch[0]?.url || '',
            source: batch.find(b => b.url === j.url)?.source || batch[0]?.source || 'unknown',
            scrapedAt: now,
          }));

        allJobs.push(...enriched);
        console.log(`[Extractor] Batch ${batchIdx + 1}: ✓ ${enriched.length} jobs extracted`);
      }
    } catch (err: any) {
      console.error(`[Extractor] Batch ${batchIdx + 1} permanently failed: ${err.message?.substring(0, 120)}`);
    }

    // Small courtesy delay between batches (not for rate limiting — that's handled by retry)
    if (batchIdx < batches.length - 1) {
      await sleep(500);
    }
  }

  console.log(`[Extractor] Complete: ${allJobs.length} total jobs extracted`);
  return allJobs;
}
