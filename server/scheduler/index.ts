import cron from 'node-cron';
import { runJobScraper } from '../services/scraper.js';

/**
 * Registers all cron-scheduled background jobs.
 * Call this once at server startup.
 */
export function scheduleScraper(): void {
  // Daily at 9:00 AM
  cron.schedule('0 9 * * *', () => {
    console.log('[Scheduler] Triggering daily job scrape...');
    runJobScraper().catch(err =>
      console.error('[Scheduler] Unhandled error in job scraper:', err)
    );
  });

  console.log('[Scheduler] Daily job scrape scheduled at 09:00 AM');
}
