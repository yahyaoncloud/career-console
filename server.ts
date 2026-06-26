import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import nodemailer from 'nodemailer';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import crypto from 'crypto';
import { connectDB } from './server/mongodb';
import apiRoutes from './server/routes/api';
import { scheduleScraper, runJobScraper } from './server/services/scraper';
import { handleTelegramUpdate, registerWebhook, deleteWebhook } from './server/integrations/telegramWebhook';

dotenv.config();

const app = express();
const PORT = 3000;

// Connect to MongoDB
// connectDB(); // Commented out for now

// Only run node-cron scheduler in local dev. In production (Vercel), use Vercel Cron.
if (!process.env.VERCEL) {
  scheduleScraper();
}

app.use(helmet({
  contentSecurityPolicy: false, // Disabled to allow Vite HMR and inline styles in dev
}));

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  message: { error: 'Too many requests from this IP, please try again later.' }
});

const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 OTP requests per hour
  message: { error: 'Too many login attempts, please try again after an hour.' }
});

app.use('/api/', apiLimiter);
app.use('/api/auth/request-otp', authLimiter);
app.use('/api/guestbook', rateLimit({ windowMs: 15 * 60 * 1000, max: 20 })); // Prevent spamming guestbook

app.use(express.json());

// Initialize Gemini SDK
const ai = process.env.GEMINI_API_KEY
  ? new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    })
  : null;

// Prioritized model fallback chain — tries each in order until one succeeds
const GEMINI_MODELS = [
  'gemini-2.5-flash',
  'gemini-2.5-flash-preview-05-20',
  'gemini-2.0-flash',
  'gemini-1.5-flash',
];

async function generateWithFallback(prompt: string, mimeType = 'application/json') {
  if (!ai) throw new Error('AI not initialized');
  let lastError: any;
  for (const model of GEMINI_MODELS) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: { responseMimeType: mimeType },
      });
      console.log(`[AI_ENGINE] Used model: ${model}`);
      return response.text || '';
    } catch (err: any) {
      console.warn(`[AI_ENGINE] Model ${model} failed: ${err.message}`);
      lastError = err;
    }
  }
  throw lastError;
}

// Initial high-fidelity seeded dataset for the internal platform
const defaultDb = {
  applications: [
    {
      id: 'app-1',
      company: 'Stripe',
      position: 'Staff Infrastructure Engineer',
      location: 'South San Francisco, CA',
      salary: '$240,000 - $280,000',
      employmentType: 'Full-time',
      appliedDate: '2026-06-10',
      deadline: '2026-07-15',
      referral: 'Nikhil (Principal SRE)',
      recruiter: 'Sarah Jenkins',
      contact: 'sjenkins@stripe.com',
      website: 'https://stripe.com',
      priority: 'High',
      status: 'Technical',
      interviewDate: '2026-06-30T10:00:00Z',
      notes: 'Deep dive into distributed systems concurrency, cache coherence, and API idempotency keys.',
      resumeUsed: 'Staff_Infrastructure_Resume_v4.pdf',
      coverLetter: 'Stripe_Cover_Letter.pdf',
      tags: ['Infrastructure', 'Scale', 'Golang'],
    },
    {
      id: 'app-2',
      company: 'Vercel',
      position: 'Senior Edge Systems Engineer',
      location: 'Remote',
      salary: '$190,000 - $220,000',
      employmentType: 'Remote',
      appliedDate: '2026-06-12',
      deadline: '2026-07-01',
      referral: 'None',
      recruiter: 'Alan Vance',
      contact: 'vance@vercel.com',
      website: 'https://vercel.com',
      priority: 'High',
      status: 'HR Screening',
      interviewDate: '2026-06-28T14:30:00Z',
      notes: 'Focus on Anycast routing networks, Cloudflare Workers, and WebAssembly compilation runtimes.',
      resumeUsed: 'Senior_Platform_Engineer_Resume.pdf',
      coverLetter: '',
      tags: ['Rust', 'WebAssembly', 'Edge'],
    },
    {
      id: 'app-3',
      company: 'Google',
      position: 'Senior Software Engineer, Spanner Core',
      location: 'Sunnyvale, CA',
      salary: '$210,000 - $250,000',
      employmentType: 'Hybrid',
      appliedDate: '2026-06-01',
      deadline: '2026-06-20',
      referral: 'Diana Lin (L6)',
      recruiter: 'Robert Chen',
      contact: 'rchen@google.com',
      website: 'https://google.com',
      priority: 'High',
      status: 'Offer',
      interviewDate: '2026-06-15T09:00:00Z',
      notes: 'Spanner distributed transaction coordinator mechanics. Consensus groups (Paxos) and TrueTime API integration.',
      resumeUsed: 'Staff_Infrastructure_Resume_v4.pdf',
      coverLetter: '',
      tags: ['Databases', 'C++', 'Consensus'],
    },
    {
      id: 'app-4',
      company: 'Netflix',
      position: 'Senior DevOps / Platform Architect',
      location: 'Los Gatos, CA',
      salary: '$450,000 Base',
      employmentType: 'Full-time',
      appliedDate: '2026-06-18',
      deadline: '2026-07-10',
      referral: 'None',
      recruiter: 'Emma Watson',
      contact: 'ewatson@netflix.com',
      website: 'https://netflix.com',
      priority: 'Medium',
      status: 'Applied',
      interviewDate: '',
      notes: 'Emphasis on chaos engineering (Chaos Monkey), multi-region AWS active-active failover, and Spinnaker CD.',
      resumeUsed: 'Senior_Platform_Engineer_Resume.pdf',
      coverLetter: '',
      tags: ['AWS', 'Kubernetes', 'Chaos'],
    },
    {
      id: 'app-5',
      company: 'Linear',
      position: 'Full-Stack Product Engineer',
      location: 'Remote',
      salary: '$180,000 - $210,000 + Equity',
      employmentType: 'Remote',
      appliedDate: '2026-06-22',
      deadline: '2026-07-20',
      referral: 'Self-apply',
      recruiter: 'Karla Lind',
      contact: 'karla@linear.app',
      website: 'https://linear.app',
      priority: 'High',
      status: 'Wishlist',
      interviewDate: '',
      notes: 'Obsess over pixel precision, high performance sync protocols (CRDTs), and SQLite client caches.',
      resumeUsed: 'Senior_Platform_Engineer_Resume.pdf',
      coverLetter: '',
      tags: ['React', 'Sync', 'TypeScript'],
    },
    {
      id: 'app-6',
      company: 'Datadog',
      position: 'Principal Observability Architect',
      location: 'New York, NY',
      salary: '$220,000 - $260,000',
      employmentType: 'Hybrid',
      appliedDate: '2026-05-10',
      deadline: '2026-05-30',
      referral: 'None',
      recruiter: 'Marcus Aurelius',
      contact: 'marcus@datadoghq.com',
      website: 'https://datadoghq.com',
      priority: 'Medium',
      status: 'Rejected',
      interviewDate: '2026-05-20T11:00:00Z',
      notes: 'Post-interview feedback indicated they wanted deeper expertise in eBPF kernel instrumentation probes.',
      resumeUsed: 'Staff_Infrastructure_Resume_v4.pdf',
      coverLetter: '',
      tags: ['eBPF', 'Metrics', 'Kernel'],
    }
  ],
  portfolio: [
    {
      id: 'proj-1',
      title: 'Decentralized Key-Value Store with Raft Consensus',
      description: 'A fault-tolerant, high-throughput distributed key-value database built in Go, utilizing custom-implemented Raft consensus protocol. Supported dynamic membership changes, log compaction via snapshots, and linearizable read operations.',
      architectureDiagram: 'Client -> Edge Router -> [Raft Leader (Node 1) <-> Follower (Node 2) <-> Follower (Node 3)] -> LevelDB Storage',
      techStack: ['Go', 'Raft', 'Protobuf', 'gRPC', 'LevelDB', 'Docker'],
      githubLink: 'https://github.com/engineer/raft-kvstore',
      demoLink: 'https://kvstore.dev.internal',
      caseStudy: 'Designed to solve strict durability guarantees during multi-region network partitions. Implemented state machine replication and verified fault tolerance using Jepsen testing frameworks under heavy network split simulations.',
      category: 'Infrastructure',
    },
    {
      id: 'proj-2',
      title: 'eBPF-Powered Kubernetes Ingress Controller & Network Monitor',
      description: 'High-performance API gateway and telemetry layer using eBPF kernel probes to bypass standard Linux iptables routing, reducing socket latency by up to 45%. Exposes sub-millisecond trace telemetry for cluster-wide inter-pod traffic.',
      architectureDiagram: 'Kubernetes Pod -> eBPF TC Probe -> Kernel Socket bypass -> Destination Pod\n                  |-> Prometheus Metric Ring Buffer',
      techStack: ['Rust', 'eBPF', 'C', 'Kubernetes', 'Prometheus', 'Grafana'],
      githubLink: 'https://github.com/engineer/ebpf-ingress',
      demoLink: 'https://ebpf.monitor.internal',
      caseStudy: 'Optimized network routing at the kernel level for latency-sensitive gRPC transactions. Bypassed typical netfilter overhead, implementing lock-free ring buffers to stream tracing metrics safely to user-space collectors.',
      category: 'DevOps',
    },
    {
      id: 'proj-3',
      title: 'Distributed Real-Time Audio Transcription and Sentiment pipeline',
      description: 'Distributed pipeline utilizing WebSockets and Kafka to ingest raw audio streams, process them through fine-tuned AI speech models, and perform parallel sentiment classification, feeding real-time operations dashboards.',
      architectureDiagram: 'Mic Capture -> Node WebSocket -> Kafka Stream -> Python Workers (Whisper) -> Gemini Sentiment API -> React Dashboard',
      techStack: ['TypeScript', 'Python', 'Apache Kafka', 'WebSockets', 'PyTorch', 'Gemini API'],
      githubLink: 'https://github.com/engineer/audio-pipeline',
      demoLink: 'https://audio.pipeline.internal',
      caseStudy: 'Achieved sub-500ms end-to-end transcription latency by optimizing Kafka partition offsets and implementing low-overhead Little-Endian PCM stream chunking on the browser client.',
      category: 'AI & ML',
    }
  ],
  resume: {
    name: 'Alexander Mercer',
    title: 'Staff Systems & Cloud Infrastructure Architect',
    contact: {
      email: 'alexander.mercer@dev.io',
      phone: '+1 (555) 489-3012',
      location: 'San Francisco, CA',
      github: 'github.com/amercer-systems',
      linkedin: 'linkedin.com/in/alex-mercer-systems',
    },
    summary: 'Senior Infrastructure Engineer and Technical Architect specializing in building ultra-low-latency, high-availability distributed systems, container orchestration planes, and kernel-level network routing agents. Veteran of multi-region database replication strategies and Spanner transaction coordination.',
    experience: [
      {
        company: 'Cloud Native Systems Corp',
        role: 'Principal Systems Engineer',
        period: '2023 - Present',
        highlights: [
          'Designed and scaled a multi-region active-active Kubernetes control plane hosting 15,000+ microservices, achieving 99.995% uptime.',
          'Developed eBPF-based socket filtering libraries in Rust, slashing packet-routing overhead inside critical payment channels by 38%.',
          'Spearheaded transition to Spanner DB, consolidating 14 legacy PostgreSQL shards and eliminating transactional drift.'
        ],
      },
      {
        company: 'Core Scale Technologies',
        role: 'Senior Staff SRE',
        period: '2020 - 2023',
        highlights: [
          'Engineered global telemetry pipelines handling 4.5 million metrics per second with Prometheus, Kafka, and ClickHouse.',
          'Implemented automated disaster recovery drills using custom chaotic network injecting daemons, testing stateful failovers.'
        ],
      }
    ],
    projects: [
      {
        name: 'Distributed Key-Value Store with Raft',
        description: 'Fault-tolerant gRPC-backed transactional store written in Go with dynamic cluster resizing support.',
        tech: ['Go', 'Raft', 'Protobuf', 'gRPC', 'Docker'],
      },
      {
        name: 'Kernel Bypass Network Ingress Agent',
        description: 'eBPF probe bypass daemon reducing API gateway proxy latency over standard routing tables.',
        tech: ['Rust', 'eBPF', 'C', 'Kubernetes'],
      }
    ],
    skills: {
      languages: ['Go', 'Rust', 'C++', 'Python', 'TypeScript', 'SQL', 'C'],
      frameworks: ['gRPC', 'Protobuf', 'React', 'Express', 'D3.js', 'PyTorch'],
      cloud: ['AWS', 'GCP (Spanner, BigQuery)', 'Kubernetes', 'Terraform', 'Vault'],
      tools: ['eBPF', 'Prometheus', 'Grafana', 'Apache Kafka', 'PostgreSQL', 'Docker'],
    },
    education: [
      {
        institution: 'University of California, Berkeley',
        degree: 'M.S. in Computer Science (Distributed Systems Research)',
        period: '2018 - 2020',
      },
      {
        institution: 'Georgia Institute of Technology',
        degree: 'B.S. in Computer Engineering',
        period: '2014 - 2018',
      }
    ],
    certifications: [
      'Certified Kubernetes Administrator (CKA)',
      'Google Cloud Professional Cloud Architect',
      'AWS Certified Solutions Architect – Professional'
    ],
  },
  documents: [
    {
      id: 'doc-1',
      name: 'Staff_Infrastructure_Resume_v4.pdf',
      type: 'Resume',
      version: 'v4.1',
      uploadedAt: '2026-06-20',
      size: '242 KB',
    },
    {
      id: 'doc-2',
      name: 'Stripe_Cover_Letter.pdf',
      type: 'Cover Letter',
      version: 'v1.0',
      uploadedAt: '2026-06-10',
      size: '115 KB',
    },
    {
      id: 'doc-3',
      name: 'Google_Cloud_Architect_Certificate.pdf',
      type: 'Certificate',
      version: 'v1.0',
      uploadedAt: '2026-05-15',
      size: '1.2 MB',
    }
  ],
  logs: [
    { timestamp: '2026-06-26T09:12:15Z', event: 'Database initialized successfully', status: 'SUCCESS', module: 'DATABASE' },
    { timestamp: '2026-06-26T09:15:33Z', event: 'Vite dev server mounted', status: 'INFO', module: 'SYSTEM' },
    { timestamp: '2026-06-26T09:30:21Z', event: 'Google Workspace OAuth scopes matched', status: 'SUCCESS', module: 'AUTH' },
    { timestamp: '2026-06-26T09:44:02Z', event: 'Telemetry loop parsed successfully', status: 'INFO', module: 'ANALYTICS' }
  ]
};

// -------------------------------------------------------------
// SECURE MONGO DATABASE & API ROUTES
// -------------------------------------------------------------
// app.use('/api', apiRoutes); // Commented out Mongo code for now

const DB_PATH = path.join(process.cwd(), 'db.json');
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || '0123456789abcdef0123456789abcdef'; // 32 chars
const IV_LENGTH = 16;

function encryptDbData(text: string) {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-gcm', Buffer.from(ENCRYPTION_KEY), iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  const authTag = cipher.getAuthTag();
  return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted.toString('hex');
}

function decryptDbData(text: string) {
  const textParts = text.split(':');
  const iv = Buffer.from(textParts.shift()!, 'hex');
  const authTag = Buffer.from(textParts.shift()!, 'hex');
  const encryptedText = Buffer.from(textParts.join(':'), 'hex');
  const decipher = crypto.createDecipheriv('aes-256-gcm', Buffer.from(ENCRYPTION_KEY), iv);
  decipher.setAuthTag(authTag);
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
}

const getDb = () => {
  if (!fs.existsSync(DB_PATH)) {
    writeDb(defaultDb);
    return defaultDb;
  }
  try {
    const raw = fs.readFileSync(DB_PATH, 'utf8');
    try {
      const decrypted = decryptDbData(raw);
      return JSON.parse(decrypted);
    } catch {
      return JSON.parse(raw);
    }
  } catch (err) {
    return defaultDb;
  }
};

const writeDb = (data: any) => {
  const payload = JSON.stringify(data, null, 2);
  const encrypted = encryptDbData(payload);
  fs.writeFileSync(DB_PATH, encrypted, 'utf8');
};

app.get('/api/db', (req, res) => {
  res.json(getDb());
});

app.post('/api/db', (req, res) => {
  const db = getDb();
  const updated = { ...db, ...req.body };
  writeDb(updated);
  res.json({ success: true, db: updated });
});

const addLog = (event: string, status: 'SUCCESS' | 'WARNING' | 'ERROR' | 'INFO', module: string) => {
  const db = getDb();
  const log = { timestamp: new Date().toISOString(), event, status, module };
  db.logs = [log, ...(db.logs || [])].slice(0, 100);
  writeDb(db);
};

app.post('/api/applications/create', (req, res) => {
  const db = getDb();
  const newApp = { id: `app-${Date.now()}`, ...req.body };
  db.applications.push(newApp);
  writeDb(db);
  addLog(`Added application for ${newApp.company} (${newApp.position})`, 'SUCCESS', 'TRACKER');
  res.json({ success: true, application: newApp });
});

app.post('/api/applications/update', (req, res) => {
  const db = getDb();
  const { id, ...updates } = req.body;
  const idx = db.applications.findIndex((a: any) => a.id === id);
  if (idx !== -1) {
    db.applications[idx] = { ...db.applications[idx], ...updates };
    writeDb(db);
    addLog(`Updated application for ${db.applications[idx].company}`, 'SUCCESS', 'TRACKER');
    res.json({ success: true, application: db.applications[idx] });
  } else {
    res.status(404).json({ error: 'Application not found' });
  }
});

app.post('/api/applications/delete', (req, res) => {
  const db = getDb();
  const { id } = req.body;
  const item = db.applications.find((a: any) => a.id === id);
  db.applications = db.applications.filter((a: any) => a.id !== id);
  writeDb(db);
  if (item) {
    addLog(`Deleted application for ${item.company}`, 'WARNING', 'TRACKER');
  }
  res.json({ success: true });
});

app.get('/api/guestbook', (req, res) => {
  const db = getDb();
  res.json({ entries: db.guestbook || [] });
});

app.post('/api/guestbook', async (req, res) => {
  const { name, message } = req.body;
  if (!name || !message) return res.status(400).json({ error: 'Missing fields' });
  const db = getDb();
  if (!db.guestbook) db.guestbook = [];
  const entry = { id: `gb-${Date.now()}`, name, message, timestamp: new Date().toISOString() };
  db.guestbook.unshift(entry);
  writeDb(db);
  res.json({ success: true, entry });
});

// AI endpoints
app.post('/api/gemini/analyze-resume', async (req, res) => {
  if (!ai) {
    return res.json({
      success: false,
      error: 'GEMINI_API_KEY is not configured on the server. Please add it via the Settings > Secrets panel.',
    });
  }

  const { textContent } = req.body;
  if (!textContent) {
    return res.status(400).json({ error: 'textContent is required' });
  }

  try {
    const prompt = `You are a Principal Engineering Resume Reviewer & LaTeX conversion expert.
Analyze the following raw resume content. Output your response as a valid JSON object matching the following structure exactly (without enclosing the markdown block with code quotes):
{
  "name": "Candidate Name",
  "title": "Clean Professional Title",
  "summary": "Impactful 2-3 sentence technical profile summary",
  "atsScore": 85,
  "criticism": ["Constructive point 1 focusing on high impact metric words", "Constructive point 2", "Constructive point 3"],
  "formattedLaTeX": "% LaTeX formatted resume string here..."
}

Raw content:
${textContent}`;

    const text = await generateWithFallback(prompt);
    const parsed = JSON.parse(text || '{}');
    addLog('AI Resume Analysis triggered', 'SUCCESS', 'AI_ENGINE');
    res.json({ success: true, ...parsed });
  } catch (error: any) {
    console.error('Gemini error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/gemini/suggest-prep', async (req, res) => {
  if (!ai) {
    return res.json({
      success: false,
      error: 'GEMINI_API_KEY is not configured on the server.',
    });
  }

  const { company, position, notes } = req.body;
  try {
    const prompt = `You are a Principal Software Engineer at ${company} conducting a Technical Architecture interview for a ${position} role.
Job Context & Notes: ${notes || 'None provided'}
Provide 3 high-probability architectural or technical questions specific to this role and company, along with deep concise hints of how to answer using senior systems-design engineering best practices. Format your output as a clean, highly technical JSON list:
[
  {
    "question": "The question here",
    "hint": "The technical hint featuring systems keywords"
  }
]`;

    const text = await generateWithFallback(prompt);
    const parsed = JSON.parse(text || '[]');
    addLog(`AI Interview prep generated for ${company}`, 'SUCCESS', 'AI_ENGINE');
    res.json({ success: true, suggestions: parsed });
  } catch (error: any) {
    console.error('Gemini prep error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Diagnostic: list available Gemini models for this API key
app.get('/api/gemini/models', async (req, res) => {
  if (!ai) {
    return res.json({ success: false, error: 'GEMINI_API_KEY not configured', models: [] });
  }
  try {
    const results: { model: string; status: string }[] = [];
    for (const model of GEMINI_MODELS) {
      try {
        await ai.models.generateContent({
          model,
          contents: 'ping',
          config: { responseMimeType: 'text/plain' },
        });
        results.push({ model, status: 'available' });
      } catch (err: any) {
        results.push({ model, status: `unavailable: ${err.message?.substring(0, 80)}` });
      }
    }
    res.json({ success: true, models: results });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// -------------------------------------------------------------
// CMS BLOG ROUTES
// -------------------------------------------------------------
const BLOGS_DIR = path.join(process.cwd(), 'content', 'blogs');

app.get('/api/blogs', (req, res) => {
  try {
    if (!fs.existsSync(BLOGS_DIR)) {
      return res.json({ blogs: [] });
    }
    const files = fs.readdirSync(BLOGS_DIR).filter(f => f.endsWith('.md'));
    const blogs = files.map(file => {
      const content = fs.readFileSync(path.join(BLOGS_DIR, file), 'utf8');
      
      // Super naive frontmatter parser for the blog
      const titleMatch = content.match(/title:\s*(.*)/);
      const dateMatch = content.match(/date:\s*(.*)/);
      const excerptMatch = content.match(/excerpt:\s*(.*)/);
      const tagsMatch = content.match(/tags:\s*(.*)/);

      return {
        slug: file.replace('.md', ''),
        title: titleMatch ? titleMatch[1].trim() : 'Untitled',
        date: dateMatch ? dateMatch[1].trim() : new Date().toISOString().split('T')[0],
        excerpt: excerptMatch ? excerptMatch[1].trim() : '',
        tags: tagsMatch ? tagsMatch[1].split(',').map(t => t.trim()) : [],
      };
    });
    
    // Sort newest first
    blogs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    res.json({ blogs });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/blogs/:slug', (req, res) => {
  try {
    const slug = req.params.slug;
    const filePath = path.join(BLOGS_DIR, `${slug}.md`);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, error: 'Not found' });
    }
    const content = fs.readFileSync(filePath, 'utf8');
    const titleMatch = content.match(/title:\s*(.*)/);
    const dateMatch = content.match(/date:\s*(.*)/);
    
    // Clean frontmatter from content body for rendering
    const cleanContent = content.replace(/---[\s\S]*?---/, '').trim();

    res.json({ 
      success: true, 
      blog: {
        slug,
        title: titleMatch ? titleMatch[1].trim() : 'Untitled',
        date: dateMatch ? dateMatch[1].trim() : '',
        content: cleanContent
      } 
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/blogs', (req, res) => {
  try {
    const { slug, content } = req.body;
    if (!fs.existsSync(BLOGS_DIR)) fs.mkdirSync(BLOGS_DIR, { recursive: true });
    fs.writeFileSync(path.join(BLOGS_DIR, `${slug}.md`), content, 'utf8');
    res.json({ success: true, slug });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.delete('/api/blogs/:slug', (req, res) => {
  try {
    const slug = req.params.slug;
    const filePath = path.join(BLOGS_DIR, `${slug}.md`);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// -------------------------------------------------------------
// JOBS CMS ROUTES (For Job Board)
// -------------------------------------------------------------
const JOBS_DIR = path.join(process.cwd(), 'content', 'jobs');

app.get('/api/jobs', (req, res) => {
  try {
    if (!fs.existsSync(JOBS_DIR)) {
      return res.json({ jobs: [] });
    }
    const files = fs.readdirSync(JOBS_DIR).filter(f => f.endsWith('.md'));
    const jobs = files.map(file => {
      const content = fs.readFileSync(path.join(JOBS_DIR, file), 'utf8');
      const titleMatch = content.match(/title:\s*(.*)/);
      const dateMatch = content.match(/date:\s*(.*)/);
      return {
        slug: file.replace('.md', ''),
        title: titleMatch ? titleMatch[1].trim() : 'Untitled',
        date: dateMatch ? dateMatch[1].trim() : new Date().toISOString().split('T')[0],
      };
    });
    
    // Sort newest first
    jobs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    res.json({ jobs });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/jobs/:slug', (req, res) => {
  try {
    const slug = req.params.slug;
    const filePath = path.join(JOBS_DIR, `${slug}.md`);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, error: 'Not found' });
    }
    const content = fs.readFileSync(filePath, 'utf8');
    const titleMatch = content.match(/title:\s*(.*)/);
    const dateMatch = content.match(/date:\s*(.*)/);
    const cleanContent = content.replace(/---[\s\S]*?---/, '').trim();

    res.json({ 
      success: true, 
      job: {
        slug,
        title: titleMatch ? titleMatch[1].trim() : 'Untitled',
        date: dateMatch ? dateMatch[1].trim() : '',
        content: cleanContent
      } 
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// -------------------------------------------------------------
// SCRAPER ROUTES
// -------------------------------------------------------------
app.post('/api/scraper/trigger', async (req, res) => {
  try {
    const { model } = req.body || {};
    // Local dev: run in-process. On Vercel use /api/telegram/webhook + GitHub Actions.
    runJobScraper(model);
    res.json({ success: true, message: 'Scraper triggered successfully. Check telegram or CMS in a few moments.' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Vercel Cron endpoint — called by vercel.json crons schedule (authenticated)
app.get('/api/scraper/cron', async (req, res) => {
  const secret = req.query.secret || req.headers['x-cron-secret'];
  if (process.env.CRON_SECRET && secret !== process.env.CRON_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  // On Vercel Hobby this times out — but GitHub Actions handles the actual work.
  // This endpoint is kept for Vercel Pro users who want in-process cron.
  res.json({ message: 'Use GitHub Actions for scraping on Vercel Hobby plan.' });
});

// -------------------------------------------------------------
// TELEGRAM BOT WEBHOOK ROUTES
// -------------------------------------------------------------

// Main webhook — Telegram pushes all bot updates here
app.post('/api/telegram/webhook', async (req, res) => {
  // Always respond 200 immediately — Telegram will retry if we don't
  res.sendStatus(200);

  // Process the update asynchronously after responding
  try {
    await handleTelegramUpdate(req.body, runJobScraper);
  } catch (err: any) {
    console.error('[Webhook] Error handling update:', err.message);
  }
});

// One-time setup: register this server's URL as the Telegram webhook
app.get('/api/telegram/setup', async (req, res) => {
  try {
    const host = req.headers['x-forwarded-host'] || req.headers.host || 'localhost:3000';
    const protocol = req.headers['x-forwarded-proto'] || 'http';
    const webhookUrl = `${protocol}://${host}/api/telegram/webhook`;

    const result = await registerWebhook(webhookUrl);
    res.json({ success: result.ok, webhookUrl, telegram: result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Remove webhook (use when switching back to polling mode locally)
app.get('/api/telegram/delete-webhook', async (req, res) => {
  try {
    await deleteWebhook();
    res.json({ success: true, message: 'Webhook deleted. Bot is back in polling mode.' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// -------------------------------------------------------------
// GUESTBOOK & EMAIL NOTIFICATIONS
// -------------------------------------------------------------
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

// Note: /api/guestbook is now handled by the modular API router.

// Configure Vite middleware in development or serve static build files in production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[CONSOLESYNC] Running production-grade pipeline on port ${PORT}`);
  });
}

startServer();
