import express from 'express';
import { defaultDb } from '../../server.js';
import { Application } from '../models/Application.js';
import { Company } from '../models/Company.js';
import { Document } from '../models/Document.js';
import { Guestbook } from '../models/Guestbook.js';
import { Log } from '../models/Log.js';
import { PortfolioData } from '../models/Portfolio.js';
import { validate, ApplicationSchema, GuestbookSchema } from '../validations/index.js';

const router = express.Router();

// ─── Helper ────────────────────────────────────────────────────────────────
const addLog = async (event: string, status: 'SUCCESS' | 'WARNING' | 'ERROR' | 'INFO', module: string) => {
  try { await new Log({ event, status, module }).save(); } catch {}
};

// ─── /api/db — Seed endpoint ───────────────────────────────────────────────
router.get('/db', async (req, res) => {
  try {
    const [applications, guestbook, logs, portfolioData, companies, documents] = await Promise.all([
      Application.find().sort({ createdAt: -1 }),
      Guestbook.find().sort({ timestamp: -1 }),
      Log.find().sort({ timestamp: -1 }).limit(100),
      PortfolioData.findOne(),
      Company.find().sort({ createdAt: -1 }),
      Document.find().sort({ createdAt: -1 }),
    ]);

    res.json({
      applications: applications.length > 0 ? applications : defaultDb.applications,
      guestbook: guestbook.length > 0 ? guestbook : [],
      logs,
      resume: portfolioData?.resume || defaultDb.resume,
      portfolio: portfolioData?.portfolio || defaultDb.portfolio,
      documents: documents.length > 0 ? documents : (portfolioData?.documents || defaultDb.documents),
      companies,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Save resume/portfolio/documents to PortfolioData
router.post('/db', async (req, res) => {
  try {
    const { resume, portfolio, documents } = req.body;
    const existing = await PortfolioData.findOne();
    const update: any = {};
    if (resume)    update.resume = resume;
    if (portfolio) update.portfolio = portfolio;
    if (documents) update.documents = documents;

    if (existing) {
      await PortfolioData.updateOne({ _id: existing._id }, { $set: update });
    } else {
      await new PortfolioData(update).save();
    }
    await addLog('Profile/Portfolio data updated', 'SUCCESS', 'CMS');
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── APPLICATIONS ──────────────────────────────────────────────────────────
router.post('/applications/create', validate(ApplicationSchema), async (req, res) => {
  try {
    const app = new Application(req.body);
    await app.save();
    await addLog(`Added application — ${app.company} (${app.position})`, 'SUCCESS', 'TRACKER');
    res.json({ success: true, application: app });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/applications/update', async (req, res) => {
  try {
    const { id, ...updates } = req.body;
    const app = await Application.findByIdAndUpdate(id, updates, { new: true });
    if (!app) return res.status(404).json({ error: 'Application not found' });
    await addLog(`Updated application — ${app.company}`, 'SUCCESS', 'TRACKER');
    res.json({ success: true, application: app });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/applications/delete', async (req, res) => {
  try {
    const { id } = req.body;
    const app = await Application.findByIdAndDelete(id);
    if (app) await addLog(`Deleted application — ${app.company}`, 'WARNING', 'TRACKER');
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── COMPANIES ─────────────────────────────────────────────────────────────
router.get('/companies', async (req, res) => {
  try {
    const companies = await Company.find().sort({ createdAt: -1 });
    res.json({ success: true, companies });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/companies/create', async (req, res) => {
  try {
    const company = new Company(req.body);
    await company.save();
    await addLog(`Added company — ${company.name}`, 'SUCCESS', 'COMPANIES');
    res.json({ success: true, company });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/companies/update', async (req, res) => {
  try {
    const { id, ...updates } = req.body;
    const company = await Company.findByIdAndUpdate(id, { ...updates, updatedAt: new Date() }, { new: true });
    if (!company) return res.status(404).json({ error: 'Company not found' });
    await addLog(`Updated company — ${company.name}`, 'SUCCESS', 'COMPANIES');
    res.json({ success: true, company });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/companies/delete', async (req, res) => {
  try {
    const { id } = req.body;
    const company = await Company.findByIdAndDelete(id);
    if (company) await addLog(`Deleted company — ${company.name}`, 'WARNING', 'COMPANIES');
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── DOCUMENTS / FILE ASSETS ───────────────────────────────────────────────
router.get('/documents', async (req, res) => {
  try {
    const docs = await Document.find().sort({ createdAt: -1 });
    res.json({ success: true, documents: docs });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/documents/create', async (req, res) => {
  try {
    const doc = new Document(req.body);
    await doc.save();
    await addLog(`Uploaded document — ${doc.name}`, 'SUCCESS', 'ASSETS');
    res.json({ success: true, document: doc });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/documents/update', async (req, res) => {
  try {
    const { id, ...updates } = req.body;
    const doc = await Document.findByIdAndUpdate(id, updates, { new: true });
    if (!doc) return res.status(404).json({ error: 'Document not found' });
    await addLog(`Updated document metadata — ${doc.name}`, 'INFO', 'ASSETS');
    res.json({ success: true, document: doc });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/documents/delete', async (req, res) => {
  try {
    const { id } = req.body;
    const doc = await Document.findByIdAndDelete(id);
    if (doc) await addLog(`Deleted document — ${doc.name}`, 'WARNING', 'ASSETS');
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── GUESTBOOK ─────────────────────────────────────────────────────────────
router.get('/guestbook', async (req, res) => {
  try {
    const entries = await Guestbook.find().sort({ timestamp: -1 });
    res.json({ entries });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/guestbook', validate(GuestbookSchema), async (req, res) => {
  try {
    const entry = new Guestbook(req.body);
    await entry.save();
    res.json({ success: true, entry });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
