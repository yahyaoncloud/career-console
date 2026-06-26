/**
 * Standalone scraper entrypoint for GitHub Actions.
 * Reads SCRAPER_MODEL env var, runs the full pipeline, then exits.
 */
import dotenv from 'dotenv';
dotenv.config();

import { runJobScraper } from '../services/scraper.js';

const model = process.env.SCRAPER_MODEL || 'gemini-2.5-pro';

console.log(`[CI] Starting scraper with model: ${model}`);

runJobScraper(model)
  .then(() => {
    console.log('[CI] Scraper finished successfully.');
    process.exit(0);
  })
  .catch(err => {
    console.error('[CI] Scraper failed:', err);
    process.exit(1);
  });
