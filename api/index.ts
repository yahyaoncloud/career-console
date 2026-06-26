/**
 * Vercel Serverless Function Entry Point
 *
 * Vercel requires serverless functions to live in the `api/` directory.
 * This file imports the fully configured Express app from server.ts
 * and adds production static file serving, then exports it for Vercel.
 *
 * The `app.listen()` call in server.ts is guarded behind `if (!process.env.VERCEL)`
 * so it will NOT run here — Vercel handles the HTTP layer itself.
 */

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { app } from '../server.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// In production on Vercel, serve the Vite-built frontend from dist/
// The dist/ directory is created by `npm run build` (vite build) during Vercel's build step
const distPath = path.join(__dirname, '..', 'dist');
app.use(express.static(distPath));

// Fallback: serve index.html for all non-API routes (SPA client-side routing)
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api/')) {
    res.sendFile(path.join(distPath, 'index.html'));
  }
});

// Vercel reads the default export as the request handler
export default app;
