import mongoose from 'mongoose';

export const connectDB = async () => {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.warn('[MongoDB] MONGO_URI is not set — skipping DB connection. Add MONGO_URI to your Vercel environment variables.');
    return;
  }
  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000, // Fail fast — don't hang the Vercel function for 30s
    });
    console.log('[MongoDB] Connected successfully');
  } catch (error) {
    console.error('[MongoDB] Connection failed:', error);
    // Don't call process.exit(1) in production — it kills the entire serverless function cold start
    if (process.env.NODE_ENV !== 'production') process.exit(1);
  }
};
