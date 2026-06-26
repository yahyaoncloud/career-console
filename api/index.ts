/**
 * Vercel Serverless Function Entry Point
 *
 * Vercel requires serverless functions to live in the `api/` directory.
 * This file imports the fully configured Express app from server.ts
 * and exports it for Vercel.
 *
 * The `app.listen()` call in server.ts is guarded behind `if (!process.env.VERCEL)`
 * so it will NOT run here — Vercel handles the HTTP layer itself.
 */

import { app } from '../server';

// Vercel reads the default export as the request handler
export default app;
