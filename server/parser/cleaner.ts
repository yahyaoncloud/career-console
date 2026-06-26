import * as cheerio from 'cheerio';

/**
 * Cleans raw HTML of a job posting page, removing navigation, footers,
 * cookie banners, ads, sidebars, and other noise. Returns plain text
 * suitable for AI extraction.
 */
export function cleanHtml(html: string, url: string): string {
  const $ = cheerio.load(html);

  // Remove non-content elements
  $(
    'script, style, noscript, iframe, svg, img, video, audio, canvas, ' +
    'nav, header, footer, aside, ' +
    '[class*="nav"], [class*="header"], [class*="footer"], [class*="sidebar"], ' +
    '[class*="cookie"], [class*="banner"], [class*="newsletter"], [class*="popup"], ' +
    '[class*="modal"], [class*="overlay"], [class*="advertisement"], [class*="ads"], ' +
    '[class*="social"], [class*="share"], [class*="related"], [class*="recommend"], ' +
    '[id*="nav"], [id*="header"], [id*="footer"], [id*="cookie"], [id*="banner"], ' +
    '[id*="sidebar"], [id*="ads"], [id*="social"], [id*="newsletter"]'
  ).remove();

  // Extract text and normalize whitespace
  const text = $('body').text()
    .replace(/\s+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  // Cap at 6000 chars to keep prompt manageable (approx 1500 tokens)
  const capped = text.length > 6000 ? text.substring(0, 6000) + '...[truncated]' : text;

  return `SOURCE_URL: ${url}\n\n${capped}`;
}

/**
 * Lightweight extractor that works from RSS rawText without crawling.
 * Used when we have pre-fetched text from the discovery layer.
 */
export function cleanRawText(rawText: string, url: string): string {
  const cleaned = rawText
    .replace(/<[^>]*>/g, ' ')   // strip HTML tags
    .replace(/\s+/g, ' ')
    .trim();

  const capped = cleaned.length > 4000 ? cleaned.substring(0, 4000) + '...[truncated]' : cleaned;
  return `SOURCE_URL: ${url}\n\n${capped}`;
}
