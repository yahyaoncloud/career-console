import express from 'express';
import { Application } from '../models/Application.js';
import { Guestbook } from '../models/Guestbook.js';
import { Log } from '../models/Log.js';
import { PortfolioData } from '../models/Portfolio.js';
import { validate, ApplicationSchema, GuestbookSchema } from '../validations/index.js';

const router = express.Router();

// Helper to log DB events
const addLog = async (event: string, status: 'SUCCESS' | 'WARNING' | 'ERROR' | 'INFO', module: string) => {
  await new Log({ event, status, module }).save();
};

// Application endpoints
router.post('/applications/create', validate(ApplicationSchema), async (req, res) => {
  try {
    const newApp = new Application(req.body);
    await newApp.save();
    await addLog(`Added application for ${newApp.company} (${newApp.position})`, 'SUCCESS', 'TRACKER');
    res.json({ success: true, application: newApp });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/applications/update', async (req, res) => {
  try {
    const { id, ...updates } = req.body;
    // Handle both _id (mongo) and id (legacy)
    const filter = id.startsWith('app-') ? { _id: id } : { _id: id }; 
    const app = await Application.findByIdAndUpdate(filter, updates, { new: true });
    if (app) {
      await addLog(`Updated application for ${app.company}`, 'SUCCESS', 'TRACKER');
      res.json({ success: true, application: app });
    } else {
      res.status(404).json({ error: 'Application not found' });
    }
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/applications/delete', async (req, res) => {
  try {
    const { id } = req.body;
    const app = await Application.findByIdAndDelete(id);
    if (app) {
      await addLog(`Deleted application for ${app.company}`, 'WARNING', 'TRACKER');
    }
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

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

// Mock the /api/db endpoint for frontend compatibility
router.get('/db', async (req, res) => {
  try {
    const applications = await Application.find();
    const guestbook = await Guestbook.find();
    const logs = await Log.find().sort({ timestamp: -1 }).limit(100);
    const portfolioData = await PortfolioData.findOne();
    
    // Fallbacks to default data from server.ts would ideally be seeded into DB.
    res.json({
      applications,
      guestbook,
      logs,
      resume: portfolioData?.resume || {},
      portfolio: portfolioData?.portfolio || [],
      documents: portfolioData?.documents || []
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
