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

export default async function (req: any, res: any) {
  try {
    // Dynamically import the app to prevent top-level invocation crashes on Vercel
    // and to catch any module resolution or initialization errors.
    const serverModule = await import('../server.js');
    const app = serverModule.app;
    
    // Pass the request to the Express app
    return app(req, res);
  } catch (err: any) {
    console.error('API Initialization Error:', err);
    res.status(500).json({
      error: 'Vercel Serverless Function Initialization Failed',
      message: err.message,
      stack: err.stack
    });
  }
}
