import axios from 'axios';

const TELEGRAM_API_BASE = `https://api.telegram.org/bot`;

export interface TelegramUpdate {
  update_id: number;
  message?: {
    message_id: number;
    from?: { id: number; first_name: string; username?: string };
    chat: { id: number; type: string };
    text?: string;
    date: number;
  };
}

async function sendReply(chatId: number, text: string): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return;
  try {
    await axios.post(`${TELEGRAM_API_BASE}${token}/sendMessage`, {
      chat_id: chatId,
      text,
      parse_mode: 'Markdown',
      disable_web_page_preview: true,
    });
  } catch (err: any) {
    console.error(`[TelegramWebhook] Send failed: ${err.message}`);
  }
}

/**
 * Triggers a GitHub Actions workflow_dispatch or repository_dispatch.
 * The GH Actions runner has unlimited time — perfect for the long-running scraper.
 * 
 * Required env vars:
 *   GH_PAT         — GitHub Personal Access Token (repo + workflow scope)
 *   GITHUB_OWNER   — e.g. "amenashahbaz"
 *   GITHUB_REPO    — e.g. "job-application-tracker-portfolio"
 */
async function triggerGitHubActions(model: string): Promise<void> {
  const token = process.env.GH_PAT;
  const owner = process.env.GITHUB_OWNER;
  const repo = process.env.GITHUB_REPO;

  if (!token || !owner || !repo) {
    throw new Error('GH_PAT, GITHUB_OWNER, and GITHUB_REPO must be set as environment variables.');
  }

  // Use repository_dispatch so we can pass arbitrary payload (including model choice)
  await axios.post(
    `https://api.github.com/repos/${owner}/${repo}/dispatches`,
    {
      event_type: 'run-scraper',
      client_payload: { model },
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
    }
  );
}

export async function handleTelegramUpdate(
  update: TelegramUpdate,
  // runScraper param kept for local dev compatibility but not used on Vercel
  _runScraper?: (model?: string) => Promise<void>
): Promise<void> {
  const message = update.message;
  if (!message || !message.text) return;

  const chatId = message.chat.id;
  const text = message.text.trim();
  const authorizedChatId = process.env.TELEGRAM_CHAT_ID;

  if (authorizedChatId && String(chatId) !== String(authorizedChatId)) {
    console.warn(`[TelegramWebhook] Unauthorized chat ID: ${chatId}`);
    return;
  }

  console.log(`[TelegramWebhook] "${text}" from chat ${chatId}`);

  const parts = text.split(/\s+/);
  const command = (parts[0] || '').replace(/@\w+$/, '').toLowerCase();
  const args = parts.slice(1).map(s => s.toLowerCase());

  switch (command) {
    case '/scrape': {
      const model = args[0] === 'flash'
        ? 'gemini-2.5-flash'
        : 'gemini-2.5-pro';

      try {
        await triggerGitHubActions(model);
        await sendReply(
          chatId,
          `🚀 *Scrape dispatched to GitHub Actions!*\n\n` +
          `Model: \`${model}\`\n` +
          `Runner: GitHub Actions (free, unlimited time)\n\n` +
          `Results will be sent here when complete _(2–5 min)_ and the CMS will update automatically via Vercel redeploy.`
        );
      } catch (err: any) {
        await sendReply(
          chatId,
          `❌ *Failed to dispatch scraper*\n\n\`${err.message?.substring(0, 200)}\`\n\n` +
          `Check that \`GH_PAT\`, \`GITHUB_OWNER\`, \`GITHUB_REPO\` are set in your Vercel environment variables.`
        );
      }
      break;
    }

    case '/jobs': {
      try {
        const fs = await import('fs');
        const path = await import('path');
        const jobsDir = path.join(process.cwd(), 'content', 'jobs');

        if (!fs.existsSync(jobsDir)) {
          await sendReply(chatId, '📭 No job reports found yet\\. Use /scrape to generate one\\.');
          break;
        }

        const files = fs.readdirSync(jobsDir)
          .filter((f: string) => f.startsWith('jobs-') && f.endsWith('.json'))
          .sort()
          .reverse();

        if (files.length === 0) {
          await sendReply(chatId, '📭 No job reports found yet. Use /scrape to generate one.');
          break;
        }

        const latest = files[0];
        const data = JSON.parse(fs.readFileSync(path.join(jobsDir, latest), 'utf8'));
        const jobs = data.jobs || [];
        const remoteCount = jobs.filter((j: any) => j.remote).length;
        const companies = new Set(jobs.map((j: any) => j.company)).size;
        const dateStr = latest.replace('jobs-', '').replace('.json', '');

        await sendReply(
          chatId,
          `📊 *Latest Report: ${dateStr}*\n\n` +
          `• Total jobs: *${jobs.length}*\n` +
          `• Remote: *${remoteCount}*\n` +
          `• Companies: *${companies}*\n\n` +
          `Use /scrape to refresh.`
        );
      } catch (err: any) {
        await sendReply(chatId, `❌ Failed to read report: ${err.message}`);
      }
      break;
    }

    case '/status': {
      const uptime = Math.floor(process.uptime());
      const m = Math.floor(uptime / 60);
      const s = uptime % 60;

      await sendReply(
        chatId,
        `🟢 *System Status*\n\n` +
        `• Uptime: \`${m}m ${s}s\`\n` +
        `• Gemini: ${process.env.GEMINI_API_KEY ? '✅' : '❌'}\n` +
        `• GitHub Actions: ${process.env.GH_PAT ? '✅ configured' : '❌ GH_PAT missing'}\n` +
        `• Platform: \`${process.env.VERCEL ? 'Vercel Hobby' : 'Local'}\`\n\n` +
        `*/scrape* dispatches to GitHub Actions (no timeout).`
      );
      break;
    }

    case '/help': {
      await sendReply(
        chatId,
        `🤖 *Job Scraper Bot*\n\n` +
        `*/scrape* — Run with Gemini 2.5 Pro\n` +
        `*/scrape flash* — Run with Gemini 2.5 Flash (faster)\n` +
        `*/jobs* — Latest report summary\n` +
        `*/status* — System health check\n` +
        `*/help* — This message\n\n` +
        `_Scraping runs on GitHub Actions (free, no Vercel timeout limits)._`
      );
      break;
    }

    default:
      if (command.startsWith('/')) {
        await sendReply(chatId, `Unknown command: \`${command}\`\nTry /help`);
      }
      break;
  }
}

export async function registerWebhook(webhookUrl: string): Promise<{ ok: boolean; description?: string }> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) throw new Error('TELEGRAM_BOT_TOKEN not configured');

  const response = await axios.post(`${TELEGRAM_API_BASE}${token}/setWebhook`, {
    url: webhookUrl,
    allowed_updates: ['message'],
    drop_pending_updates: true,
  });

  return response.data;
}

export async function deleteWebhook(): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return;
  await axios.post(`${TELEGRAM_API_BASE}${token}/deleteWebhook`, { drop_pending_updates: false });
}
