# 🚀 Career Console

> A full-stack job application tracker, portfolio CMS, and AI-powered career hub — built for cloud engineers who move fast.

Live: **[career-console.vercel.app](https://career-console.vercel.app)**

---

## ✨ Features

| Feature | Description |
|---|---|
| 📋 **Application Tracker** | Track job applications with status, recruiter details, deadlines, and notes |
| 🧠 **AI Resume Analyzer** | Upload or paste your resume and get an ATS score, criticism, and formatted LaTeX output via Gemini |
| 📰 **Job Scraper** | Automated multi-source job scraper triggered via Telegram or GitHub Actions |
| 🤖 **Telegram Bot** | Control your scraper, check status, and get reports from your phone |
| 💼 **Portfolio CMS** | Manage your personal portfolio projects and case studies, stored in MongoDB |
| 📓 **Guestbook** | Visitors can leave public messages on your portfolio |
| 🔒 **Security** | Helmet headers, rate limiting, OTP-based auth, and encrypted session management |

---

## 🏗 Architecture

```
React (Vite) Client
       │
       ▼
Vercel Edge Network
  ├── Static Assets  (dist/)
  └── Serverless API (api/index.ts → server.ts → Express)
              │
              ├── MongoDB Atlas  (applications, portfolio, guestbook, logs)
              ├── Gemini AI API  (resume analysis, job extraction)
              └── Telegram Bot   (webhook → GitHub Actions dispatch)
```

---

## 🛠 Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Backend**: Node.js, Express, TypeScript
- **Database**: MongoDB Atlas (via Mongoose)
- **AI**: Google Gemini 2.5 (with model fallback chain)
- **Deployment**: Vercel (Serverless Functions + Edge CDN)
- **Automation**: GitHub Actions, Telegram Bot API, node-cron

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- A [MongoDB Atlas](https://mongodb.com/atlas) cluster
- A [Gemini API Key](https://aistudio.google.com)

### 1. Clone & Install

```bash
git clone https://github.com/yahyaoncloud/career-console
cd career-console
npm install
```

### 2. Configure Environment

Copy the example env file and fill in your values:

```bash
cp .env.example .env
```

| Variable | Description |
|---|---|
| `GEMINI_API_KEY` | Google AI Studio API key |
| `MONGO_URI` | MongoDB Atlas connection string |
| `ENCRYPTION_KEY` | 32-char string for session encryption |
| `JWT_SECRET` | Secret for JWT signing |
| `TELEGRAM_BOT_TOKEN` | Bot token from [@BotFather](https://t.me/BotFather) |
| `TELEGRAM_CHAT_ID` | Your Telegram user/chat ID |
| `GH_PAT` | GitHub Personal Access Token (repo + workflow scopes) |
| `GITHUB_OWNER` | Your GitHub username |
| `GITHUB_REPO` | Repository name |

### 3. Seed Your Profile Data

```bash
npx tsx seed.ts
```

This writes your portfolio and resume data to MongoDB. Edit `seed.ts` to customise your profile.

### 4. Run Locally

```bash
npm run dev
```

App runs at `http://localhost:3000`

---

## ☁️ Deploying to Vercel

1. Push to GitHub
2. Import the repo in [vercel.com/new](https://vercel.com/new)
3. Add all environment variables from `.env.example` in **Settings → Environment Variables**
4. Deploy — Vercel handles everything else via `vercel.json`

---

## 🤖 Telegram Bot Commands

Once your bot is configured and the webhook is registered (`GET /api/telegram/setup`):

| Command | Action |
|---|---|
| `/scrape` | Dispatch job scraper via GitHub Actions (Gemini 2.5 Pro) |
| `/scrape flash` | Dispatch with Gemini 2.5 Flash (faster) |
| `/jobs` | Show the latest scraped job report |
| `/status` | System health check |
| `/help` | List all commands |

---

## 📁 Project Structure

```
├── api/
│   └── index.ts          # Vercel serverless entry point
├── server/
│   ├── models/           # Mongoose models (Application, Portfolio, Guestbook, Log)
│   ├── routes/           # Express route handlers
│   ├── services/         # Job scraper orchestration
│   ├── integrations/     # Telegram webhook handler
│   └── mongodb.ts        # MongoDB connection
├── src/                  # React frontend (Vite)
├── server.ts             # Main Express app
├── seed.ts               # One-time DB seed script
└── vercel.json           # Vercel deployment config
```

---

## 📄 License

MIT — built by [Yahya](https://github.com/yahyaoncloud)
