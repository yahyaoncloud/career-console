import TelegramBot from 'node-telegram-bot-api';
import type { ExtractedJob } from '../extractor/types.js';

function getRemoteEmoji(job: ExtractedJob): string {
  return job.remote ? '🌐' : '🏢';
}

function truncate(str: string, max: number): string {
  return str.length > max ? str.substring(0, max - 1) + '…' : str;
}

/**
 * Builds a concise Telegram report from extracted jobs.
 * Groups by experience level for readability.
 */
export function buildTelegramReport(jobs: ExtractedJob[], dateStr: string): string {
  const total = jobs.length;
  const remoteCount = jobs.filter(j => j.remote).length;
  const companies = new Set(jobs.map(j => j.company));

  const lines: string[] = [
    `🚀 *Daily Cloud Jobs Report*`,
    `_${dateStr}_`,
    ``,
  ];

  // Group into Senior/Lead, Mid, and Other
  const senior = jobs.filter(j =>
    j.experienceLevel && ['Senior', 'Staff', 'Principal', 'Lead'].includes(j.experienceLevel)
  );
  const mid = jobs.filter(j =>
    j.experienceLevel && ['Mid', 'Junior'].includes(j.experienceLevel)
  );
  const other = jobs.filter(j => !j.experienceLevel);

  const formatGroup = (title: string, group: ExtractedJob[]): string[] => {
    if (group.length === 0) return [];
    const items = group.slice(0, 12).map(j => {
      const salary = j.salary ? ` | ${truncate(j.salary, 20)}` : '';
      return `${getRemoteEmoji(j)} [${truncate(j.title, 40)}](${j.url}) — *${truncate(j.company, 30)}*${salary}`;
    });
    return [`*${title}*`, ...items, ''];
  };

  lines.push(...formatGroup('🔹 Senior / Staff / Lead', senior));
  lines.push(...formatGroup('🔸 Mid-level', mid));
  lines.push(...formatGroup('⚪ Other Roles', other));

  lines.push(`📊 *Total: ${total} jobs* | 🌐 Remote: ${remoteCount} | 🏢 Companies: ${companies.size}`);

  return lines.join('\n');
}

/**
 * Sends the formatted report to Telegram.
 * Splits into multiple messages if the report exceeds Telegram's 4096 char limit.
 */
export async function sendTelegramReport(
  jobs: ExtractedJob[],
  dateStr: string
): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN || '';
  const chatId = process.env.TELEGRAM_CHAT_ID || '';

  if (!token || !chatId || token.startsWith('1234567890')) {
    console.log('[Telegram] Bot not configured. Skipping Telegram notification.');
    return;
  }

  const bot = new TelegramBot(token, { polling: false });
  const report = buildTelegramReport(jobs, dateStr);

  // Split into 4000-char chunks to respect Telegram limits
  const MAX_CHUNK = 4000;
  const chunks: string[] = [];
  let current = '';
  for (const line of report.split('\n')) {
    if ((current + '\n' + line).length > MAX_CHUNK) {
      chunks.push(current);
      current = line;
    } else {
      current += (current ? '\n' : '') + line;
    }
  }
  if (current) chunks.push(current);

  for (let i = 0; i < chunks.length; i++) {
    try {
      await bot.sendMessage(chatId, chunks[i], {
        parse_mode: 'Markdown',
        disable_web_page_preview: true,
      } as any);
      console.log(`[Telegram] Sent chunk ${i + 1}/${chunks.length}`);
    } catch (err: any) {
      console.error(`[Telegram] Failed to send chunk ${i + 1}: ${err.message}`);
    }
  }

  console.log(`[Telegram] Report sent: ${jobs.length} jobs across ${chunks.length} message(s)`);
}
